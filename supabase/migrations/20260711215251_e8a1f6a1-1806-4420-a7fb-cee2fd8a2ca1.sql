
-- 1. Retire the old combined RPC
REVOKE ALL ON FUNCTION public.get_public_tour(text) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.get_public_tour(text);

-- 2. Branded public tour RPC (explicit allowlist)
CREATE OR REPLACE FUNCTION public.get_public_branded_tour(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings;
  v_company jsonb;
  v_tracking jsonb;
  v_privacy jsonb;
  v_listing_json jsonb;
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
    'hero_image_url', v_listing.hero_image_url,
    'gallery_urls', v_listing.gallery_urls,
    'primary_media_type', v_listing.primary_media_type,
    'primary_media_url', v_listing.primary_media_url,
    'secondary_media_url', v_listing.secondary_media_url,
    'mls_number', v_listing.mls_number,
    'agent_name', v_listing.agent_name,
    'agent_phone', v_listing.agent_phone,
    'agent_email', v_listing.agent_email,
    'brokerage_name', v_listing.brokerage_name,
    'brokerage_logo_url', v_listing.brokerage_logo_url,
    'show_address_on_unbranded', v_listing.show_address_on_unbranded,
    'slug', v_listing.slug
  );

  SELECT jsonb_build_object(
           'id', c.id,
           'name', c.name,
           'logo_url', c.logo_url,
           'brand_color', c.brand_color
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

REVOKE ALL ON FUNCTION public.get_public_branded_tour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branded_tour(text) TO anon, authenticated;

-- 3. Unbranded public tour RPC (strict minimization)
CREATE OR REPLACE FUNCTION public.get_public_unbranded_tour(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings;
  v_tracking jsonb;
  v_privacy jsonb;
  v_listing_json jsonb;
BEGIN
  SELECT * INTO v_listing
    FROM public.listings
   WHERE slug = p_slug AND status = 'active'
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Base allowlist: no agent/brokerage/company fields, no company_id.
  v_listing_json := jsonb_build_object(
    'id', v_listing.id,
    'price', v_listing.price,
    'beds', v_listing.beds,
    'baths', v_listing.baths,
    'sqft', v_listing.sqft,
    'description', v_listing.description,
    'hero_image_url', v_listing.hero_image_url,
    'gallery_urls', v_listing.gallery_urls,
    'primary_media_type', v_listing.primary_media_type,
    'primary_media_url', v_listing.primary_media_url,
    'secondary_media_url', v_listing.secondary_media_url,
    'mls_number', v_listing.mls_number,
    'show_address_on_unbranded', v_listing.show_address_on_unbranded,
    'slug', v_listing.slug
  );

  -- Only include address fields when explicitly allowed.
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

REVOKE ALL ON FUNCTION public.get_public_unbranded_tour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_unbranded_tour(text) TO anon, authenticated;

-- 4. Sanctioned public event recorder
CREATE OR REPLACE FUNCTION public.record_public_event(
  p_slug text,
  p_page_type text,
  p_event_type text,
  p_referrer text,
  p_utm_source text,
  p_utm_campaign text,
  p_user_agent text,
  p_device_type text,
  p_visitor_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id uuid;
  v_company_id uuid;
BEGIN
  IF p_page_type NOT IN ('branded','unbranded') THEN
    RAISE EXCEPTION 'invalid page_type';
  END IF;
  IF p_event_type NOT IN ('page_view','media_click','video_play','cta_click','outbound_click') THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;

  SELECT id, company_id
    INTO v_listing_id, v_company_id
    FROM public.listings
   WHERE slug = p_slug AND status = 'active'
   LIMIT 1;

  IF v_listing_id IS NULL THEN
    -- Silently ignore to avoid leaking listing existence
    RETURN;
  END IF;

  INSERT INTO public.events (
    listing_id, company_id, page_type, event_type,
    referrer, utm_source, utm_campaign, user_agent, device_type, visitor_hash
  ) VALUES (
    v_listing_id, v_company_id, p_page_type::page_type, p_event_type::event_type,
    p_referrer, p_utm_source, p_utm_campaign, p_user_agent, p_device_type, p_visitor_hash
  );
END $$;

REVOKE ALL ON FUNCTION public.record_public_event(text,text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_event(text,text,text,text,text,text,text,text,text) TO anon, authenticated;

-- 5. Revoke anonymous direct access to listings
DROP POLICY IF EXISTS "anon read active listings" ON public.listings;
REVOKE SELECT ON public.listings FROM anon;

-- 6. Remove direct event INSERT access; all writes go through record_public_event
DROP POLICY IF EXISTS "anon inserts validated events" ON public.events;
DROP POLICY IF EXISTS "authenticated inserts validated events" ON public.events;
REVOKE INSERT ON public.events FROM anon, authenticated;
