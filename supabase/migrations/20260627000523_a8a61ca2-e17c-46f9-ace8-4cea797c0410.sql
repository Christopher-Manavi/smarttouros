
-- 1. Remove broad anon SELECT policies (sensitive columns were exposed)
DROP POLICY IF EXISTS "anon view companies" ON public.companies;
DROP POLICY IF EXISTS "anon read tracking" ON public.tracking_settings;
DROP POLICY IF EXISTS "anon read privacy" ON public.privacy_settings;

REVOKE SELECT ON public.companies FROM anon;
REVOKE SELECT ON public.tracking_settings FROM anon;
REVOKE SELECT ON public.privacy_settings FROM anon;

-- 2. Safe public tour bundle RPC (only public-safe columns)
CREATE OR REPLACE FUNCTION public.get_public_tour(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings;
  v_company_pub jsonb;
  v_tracking jsonb;
  v_privacy jsonb;
BEGIN
  SELECT * INTO v_listing
    FROM public.listings
   WHERE slug = p_slug AND status = 'active'
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
           'id', c.id,
           'name', c.name,
           'logo_url', c.logo_url,
           'brand_color', c.brand_color
         )
    INTO v_company_pub
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

  SELECT to_jsonb(p) INTO v_privacy
    FROM public.privacy_settings p
   WHERE p.company_id = v_listing.company_id;

  RETURN jsonb_build_object(
    'listing', to_jsonb(v_listing),
    'company', v_company_pub,
    'tracking', v_tracking,
    'privacy', v_privacy
  );
END $$;

REVOKE ALL ON FUNCTION public.get_public_tour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tour(text) TO anon, authenticated;

-- 3. Lock down internal SECURITY DEFINER helpers (only RLS/system needs them)
REVOKE EXECUTE ON FUNCTION public.get_my_company_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
-- They remain callable inside RLS policies (executed as definer/owner).
-- Grant authenticated so any direct policy/EXECUTE path still works.
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 4. Storage: per-company write isolation on listing-media and company-logos.
--    Path convention: "<company_id>/..." enforced by app code.
DROP POLICY IF EXISTS "authenticated upload listing-media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated update listing-media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated delete listing-media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated read listing-media" ON storage.objects;

DROP POLICY IF EXISTS "authenticated upload company-logos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated update company-logos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated delete company-logos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated read company-logos" ON storage.objects;

CREATE POLICY "company read listing-media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company write listing-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company update listing-media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = public.get_my_company_id()::text)
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company delete listing-media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company read company-logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company write company-logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company update company-logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = public.get_my_company_id()::text)
  WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

CREATE POLICY "company delete company-logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = public.get_my_company_id()::text);

-- Anonymous read remains for signed-URL rendering on public tours
-- (existing "public read listing-media" / "public read company-logos" policies are unchanged).
