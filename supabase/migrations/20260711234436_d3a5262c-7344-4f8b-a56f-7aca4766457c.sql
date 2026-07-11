CREATE OR REPLACE FUNCTION public.enforce_tracking_settings_restricted_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
    IF NEW.untitled_script IS NOT NULL
       OR NEW.ga_script IS NOT NULL
       OR NEW.meta_pixel_script IS NOT NULL
       OR NEW.custom_header_script IS NOT NULL
       OR NEW.custom_footer_script IS NOT NULL
       OR COALESCE(NEW.enable_branded_tracking, false) = true
       OR COALESCE(NEW.enable_unbranded_tracking, false) = true THEN
      RAISE EXCEPTION 'Only super_admin may configure tracking scripts or enable tracking'
        USING ERRCODE = '42501';
    END IF;
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
$$;

DROP TRIGGER IF EXISTS trg_tracking_settings_restricted ON public.tracking_settings;
CREATE TRIGGER trg_tracking_settings_restricted
BEFORE INSERT OR UPDATE ON public.tracking_settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_tracking_settings_restricted_fields();