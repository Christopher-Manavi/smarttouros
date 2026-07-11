-- =====================================================================
-- Security Hardening Pass 2 — Migration C:
-- Final lockdown. Runs AFTER rotation. Objects now live under
-- {company_id}/{listing_id}/{uuid}.ext for listing media (or
-- {company_id}/{uuid}.ext for company-logos).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. External-URL blocker trigger.
--    *_url columns are reserved for external media (YouTube, Vimeo,
--    Matterport, direct video URLs). Reject any value pointing at
--    Supabase Storage.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_supabase_storage_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_pattern text := '/storage/v1/(object|render/image)/';
BEGIN
  IF TG_TABLE_NAME = 'listings' THEN
    IF NEW.hero_image_url ~ v_pattern OR
       NEW.primary_media_url ~ v_pattern OR
       NEW.secondary_media_url ~ v_pattern OR
       NEW.brokerage_logo_url ~ v_pattern THEN
      RAISE EXCEPTION 'Storage URLs are not allowed in *_url columns. Use *_storage_path instead.'
        USING ERRCODE = '22023';
    END IF;
    IF NEW.gallery_urls IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(NEW.gallery_urls) u WHERE u ~ v_pattern
    ) THEN
      RAISE EXCEPTION 'Storage URLs are not allowed in listings.gallery_urls. Use gallery_storage_paths instead.'
        USING ERRCODE = '22023';
    END IF;
  ELSIF TG_TABLE_NAME = 'companies' THEN
    IF NEW.logo_url ~ v_pattern THEN
      RAISE EXCEPTION 'Storage URLs are not allowed in companies.logo_url. Use logo_storage_path instead.'
        USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_supabase_storage_url() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_listings_reject_storage_url ON public.listings;
CREATE TRIGGER trg_listings_reject_storage_url
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.reject_supabase_storage_url();

DROP TRIGGER IF EXISTS trg_companies_reject_storage_url ON public.companies;
CREATE TRIGGER trg_companies_reject_storage_url
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.reject_supabase_storage_url();

-- ---------------------------------------------------------------------
-- 2. Storage RLS lockdown.
--    Drop anon SELECT everywhere. Rebuild company-scoped policies with
--    explicit bucket_id checks and full USING + WITH CHECK coverage.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "public read listing-media" ON storage.objects;
DROP POLICY IF EXISTS "public read company-logos" ON storage.objects;

DROP POLICY IF EXISTS "company read listing-media" ON storage.objects;
DROP POLICY IF EXISTS "company write listing-media" ON storage.objects;
DROP POLICY IF EXISTS "company update listing-media" ON storage.objects;
DROP POLICY IF EXISTS "company delete listing-media" ON storage.objects;

DROP POLICY IF EXISTS "company read company-logos" ON storage.objects;
DROP POLICY IF EXISTS "company write company-logos" ON storage.objects;
DROP POLICY IF EXISTS "company update company-logos" ON storage.objects;
DROP POLICY IF EXISTS "company delete company-logos" ON storage.objects;

-- listing-media: same-company access only, with bucket_id pinned.
CREATE POLICY "listing_media_select_own_company"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-media'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "listing_media_insert_own_company"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-media'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "listing_media_update_own_company"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-media'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  )
  WITH CHECK (
    bucket_id = 'listing-media'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "listing_media_delete_own_company"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-media'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- company-logos: same shape.
CREATE POLICY "company_logos_select_own_company"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "company_logos_insert_own_company"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "company_logos_update_own_company"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

CREATE POLICY "company_logos_delete_own_company"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- ---------------------------------------------------------------------
-- 3. Rewrite public tour RPCs to strip all storage information.
--    They now return only external media URLs and metadata.
--    Media that lives in Storage is signed by the server-only
--    signPublicTourMedia function — never through these RPCs.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_branded_tour(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_listing public.listings;
  v_company jsonb;
  v_tracking jsonb;
  v_privacy jsonb;
  v_listing_json jsonb;
  v_pattern text := '/storage/v1/(object|render/image)/';
BEGIN
  SELECT * INTO v_listing
    FROM public.listings
   WHERE slug = p_slug AND status = 'active'
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- URL fields are only surfaced when they are NOT Supabase storage URLs.
  v_listing_json := jsonb_build_object(
    'id', v_listing.id,
    'company_id', v_listing.company_id,
    'address', v_listing.address,
    'city', v_listing.city,
    'state', v_listing.state,
    'zip', v_listing.zip,
    'price', v_listing.price,
    'beds', v_listing.beds,
    'baths', v_listing.baths,
    'sqft', v_listing.sqft,
    'description', v_listing.description,
    'primary_media_type', v_listing.primary_media_type,
    'primary_media_url', CASE WHEN v_listing.primary_media_url ~ v_pattern THEN NULL ELSE v_listing.primary_media_url END,
    'secondary_media_url', CASE WHEN v_listing.secondary_media_url ~ v_pattern THEN NULL ELSE v_listing.secondary_media_url END,
    'mls_number', v_listing.mls_number,
    'agent_name', v_listing.agent_name,
    'agent_phone', v_listing.agent_phone,
    'agent_email', v_listing.agent_email,
    'brokerage_name', v_listing.brokerage_name,
    'show_address_on_unbranded', v_listing.show_address_on_unbranded,
    'slug', v_listing.slug,
    'has_hero_media', v_listing.hero_image_storage_path IS NOT NULL,
    'gallery_count', COALESCE(array_length(v_listing.gallery_storage_paths, 1), 0),
    'has_primary_media_file', v_listing.primary_media_storage_path IS NOT NULL,
    'has_secondary_media_file', v_listing.secondary_media_storage_path IS NOT NULL,
    'has_brokerage_logo', v_listing.brokerage_logo_storage_path IS NOT NULL
  );

  SELECT jsonb_build_object(
           'id', c.id,
           'name', c.name,
           'brand_color', c.brand_color,
           'has_logo', c.logo_storage_path IS NOT NULL
         )
    INTO v_company
    FROM public.companies c
   WHERE c.id = v_listing.company_id;

  SELECT jsonb_build_object(
           'enable_branded_tracking', t.enable_branded_tracking,
           'enable_unbranded_tracking', t.enable_unbranded_tracking,
           'enable_privacy_banner', t.enable_privacy_banner,
           'untitled_script', t.untitled_script,
           'ga_script', t.ga_script,
           'meta_pixel_script', t.meta_pixel_script,
           'custom_header_script', t.custom_header_script,
           'custom_footer_script', t.custom_footer_script
         )
    INTO v_tracking
    FROM public.tracking_settings t
   WHERE t.company_id = v_listing.company_id;

  SELECT jsonb_build_object(
           'privacy_policy_url', p.privacy_policy_url,
           'terms_url', p.terms_url,
           'show_privacy_notice', p.show_privacy_notice,
           'privacy_notice_text', p.privacy_notice_text
         )
    INTO v_privacy
    FROM public.privacy_settings p
   WHERE p.company_id = v_listing.company_id;

  RETURN jsonb_build_object(
    'listing', v_listing_json,
    'company', v_company,
    'tracking', v_tracking,
    'privacy', v_privacy
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_public_unbranded_tour(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_listing public.listings;
  v_tracking jsonb;
  v_privacy jsonb;
  v_listing_json jsonb;
  v_pattern text := '/storage/v1/(object|render/image)/';
BEGIN
  SELECT * INTO v_listing
    FROM public.listings
   WHERE slug = p_slug AND status = 'active'
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_listing_json := jsonb_build_object(
    'id', v_listing.id,
    'price', v_listing.price,
    'beds', v_listing.beds,
    'baths', v_listing.baths,
    'sqft', v_listing.sqft,
    'description', v_listing.description,
    'primary_media_type', v_listing.primary_media_type,
    'primary_media_url', CASE WHEN v_listing.primary_media_url ~ v_pattern THEN NULL ELSE v_listing.primary_media_url END,
    'secondary_media_url', CASE WHEN v_listing.secondary_media_url ~ v_pattern THEN NULL ELSE v_listing.secondary_media_url END,
    'mls_number', v_listing.mls_number,
    'show_address_on_unbranded', v_listing.show_address_on_unbranded,
    'slug', v_listing.slug,
    'has_hero_media', v_listing.hero_image_storage_path IS NOT NULL,
    'gallery_count', COALESCE(array_length(v_listing.gallery_storage_paths, 1), 0),
    'has_primary_media_file', v_listing.primary_media_storage_path IS NOT NULL,
    'has_secondary_media_file', v_listing.secondary_media_storage_path IS NOT NULL
  );

  IF COALESCE(v_listing.show_address_on_unbranded, false) THEN
    v_listing_json := v_listing_json
      || jsonb_build_object(
        'address', v_listing.address,
        'city', v_listing.city,
        'state', v_listing.state,
        'zip', v_listing.zip
      );
  END IF;

  SELECT jsonb_build_object(
           'enable_branded_tracking', t.enable_branded_tracking,
           'enable_unbranded_tracking', t.enable_unbranded_tracking,
           'enable_privacy_banner', t.enable_privacy_banner,
           'untitled_script', t.untitled_script,
           'ga_script', t.ga_script,
           'meta_pixel_script', t.meta_pixel_script,
           'custom_header_script', t.custom_header_script,
           'custom_footer_script', t.custom_footer_script
         )
    INTO v_tracking
    FROM public.tracking_settings t
   WHERE t.company_id = v_listing.company_id;

  SELECT jsonb_build_object(
           'privacy_policy_url', p.privacy_policy_url,
           'terms_url', p.terms_url,
           'show_privacy_notice', p.show_privacy_notice,
           'privacy_notice_text', p.privacy_notice_text
         )
    INTO v_privacy
    FROM public.privacy_settings p
   WHERE p.company_id = v_listing.company_id;

  RETURN jsonb_build_object(
    'listing', v_listing_json,
    'company', NULL,
    'tracking', v_tracking,
    'privacy', v_privacy
  );
END $$;

-- Re-establish tight execution grants (idempotent).
REVOKE ALL ON FUNCTION public.get_public_branded_tour(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_unbranded_tour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branded_tour(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_unbranded_tour(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_branded_tour(text) IS
  'Pass 2: allowlisted branded tour data. Never returns storage URLs, paths, or buckets. Media signed separately by signPublicTourMedia.';
COMMENT ON FUNCTION public.get_public_unbranded_tour(text) IS
  'Pass 2: allowlisted unbranded tour data. Omits agent/brokerage/company. Never returns storage URLs, paths, or buckets.';
