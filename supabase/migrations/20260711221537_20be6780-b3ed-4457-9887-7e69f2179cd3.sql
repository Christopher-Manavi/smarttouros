-- =====================================================================
-- Security Hardening Pass 2 — Migration B:
-- Add dedicated storage-path columns + helper + rate-limit table.
-- No enforcement yet — Migration C flips the switches AFTER rotation.
-- =====================================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS hero_image_storage_path text,
  ADD COLUMN IF NOT EXISTS gallery_storage_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_media_storage_path text,
  ADD COLUMN IF NOT EXISTS secondary_media_storage_path text,
  ADD COLUMN IF NOT EXISTS brokerage_logo_storage_path text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_storage_path text;

-- Helper: extract Supabase Storage object key from a legacy signed/public URL.
-- Returns NULL if the URL doesn't reference the given bucket via
--   /storage/v1/object/(public|sign|authenticated|render/image)/{bucket}/{key}?...
CREATE OR REPLACE FUNCTION public.extract_supabase_object_path(
  p_url text,
  p_bucket text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_catalog
AS $$
  SELECT CASE
    WHEN p_url IS NULL OR p_bucket IS NULL THEN NULL
    ELSE substring(
      p_url
      FROM '/storage/v1/(?:object|render/image)/(?:public|sign|authenticated)/'
           || replace(p_bucket, '.', '\.')
           || '/([^?#]+)'
    )
  END
$$;

REVOKE ALL ON FUNCTION public.extract_supabase_object_path(text, text) FROM PUBLIC;

-- Rate-limit ledger for signPublicTourMedia. Bucketed 1-minute windows.
CREATE TABLE IF NOT EXISTS public.media_sign_rate_limit (
  bucket_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_started_at)
);

-- Only service_role touches this table. anon/authenticated have no privileges.
REVOKE ALL ON public.media_sign_rate_limit FROM PUBLIC;
REVOKE ALL ON public.media_sign_rate_limit FROM anon;
REVOKE ALL ON public.media_sign_rate_limit FROM authenticated;
GRANT ALL ON public.media_sign_rate_limit TO service_role;

ALTER TABLE public.media_sign_rate_limit ENABLE ROW LEVEL SECURITY;
-- No policies => no access for anon/authenticated even if grants leak.

CREATE INDEX IF NOT EXISTS idx_media_sign_rate_limit_window
  ON public.media_sign_rate_limit (window_started_at);

COMMENT ON TABLE public.media_sign_rate_limit IS
  'Pass 2: bucketed request counter for signPublicTourMedia. Service-role only.';
