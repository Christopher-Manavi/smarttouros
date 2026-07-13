-- Fix signup regression: allow the trusted onboarding path to INSERT a default
-- tracking_settings row, while keeping all script/toggle changes restricted to
-- super_admin. Table defaults enable_branded_tracking=true and
-- enable_unbranded_tracking=true; UNIQUE(company_id) prevents duplicate rows,
-- so the only real security invariant on INSERT is "no arbitrary script content
-- may be smuggled in". Toggle changes are still blocked on UPDATE for ordinary
-- users, so an INSERT with default toggles cannot be used to escalate.

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
    -- Ordinary callers (including the SECURITY DEFINER onboarding trigger
    -- handle_new_user) may create the initial per-company row ONLY when it
    -- carries no script content. UNIQUE(company_id) prevents a second row,
    -- and toggle changes are still blocked on UPDATE below, so a default
    -- INSERT cannot be used to escalate privileges.
    IF NEW.untitled_script IS NOT NULL
       OR NEW.ga_script IS NOT NULL
       OR NEW.meta_pixel_script IS NOT NULL
       OR NEW.custom_header_script IS NOT NULL
       OR NEW.custom_footer_script IS NOT NULL THEN
      RAISE EXCEPTION 'Only super_admin may configure tracking scripts'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: continue rejecting any non-super_admin change to restricted fields.
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