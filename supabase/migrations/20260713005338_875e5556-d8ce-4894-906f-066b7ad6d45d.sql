
-- 1. Harden INSERT defaults for non-super_admin and keep UPDATE restrictions
CREATE OR REPLACE FUNCTION public.enforce_tracking_settings_restricted_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_is_service boolean := (current_setting('request.jwt.claim.role', true) = 'service_role')
                          OR (current_user = 'service_role')
                          OR (session_user = 'service_role');
  v_is_super boolean := FALSE;
BEGIN
  IF v_is_service THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_is_super := public.has_role(auth.uid(), 'super_admin'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    v_is_super := FALSE;
  END;

  IF v_is_super THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Non-super_admin INSERT must match the trusted onboarding defaults exactly.
    IF NEW.untitled_script IS NOT NULL
       OR NEW.ga_script IS NOT NULL
       OR NEW.meta_pixel_script IS NOT NULL
       OR NEW.custom_header_script IS NOT NULL
       OR NEW.custom_footer_script IS NOT NULL THEN
      RAISE EXCEPTION 'Only super_admin may configure tracking scripts'
        USING ERRCODE = '42501';
    END IF;
    IF COALESCE(NEW.enable_branded_tracking, true) IS DISTINCT FROM true
       OR COALESCE(NEW.enable_unbranded_tracking, true) IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Only super_admin may modify tracking toggles'
        USING ERRCODE = '42501';
    END IF;
    -- Normalize to approved defaults defensively.
    NEW.enable_branded_tracking := true;
    NEW.enable_unbranded_tracking := true;
    RETURN NEW;
  END IF;

  IF NEW.untitled_script IS DISTINCT FROM OLD.untitled_script
     OR NEW.ga_script IS DISTINCT FROM OLD.ga_script
     OR NEW.meta_pixel_script IS DISTINCT FROM OLD.meta_pixel_script
     OR NEW.custom_header_script IS DISTINCT FROM OLD.custom_header_script
     OR NEW.custom_footer_script IS DISTINCT FROM OLD.custom_footer_script
     OR NEW.enable_branded_tracking IS DISTINCT FROM OLD.enable_branded_tracking
     OR NEW.enable_unbranded_tracking IS DISTINCT FROM OLD.enable_unbranded_tracking THEN
    RAISE EXCEPTION 'Only super_admin may modify tracking scripts or tracking toggles'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2/3. Replace the FOR ALL company-admin policy with explicit INSERT + UPDATE
-- policies scoped to the caller's own company. No DELETE policy → ordinary
-- authenticated users cannot delete and recreate the row.
DROP POLICY IF EXISTS "company admins manage tracking" ON public.tracking_settings;

CREATE POLICY "company admins insert tracking"
  ON public.tracking_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.has_role(auth.uid(), 'company_admin'::public.app_role)
  );

CREATE POLICY "company admins update tracking"
  ON public.tracking_settings
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_my_company_id()
    AND public.has_role(auth.uid(), 'company_admin'::public.app_role)
  )
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.has_role(auth.uid(), 'company_admin'::public.app_role)
  );
