CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  new_company_id UUID;
  v_full_name TEXT;
  v_company_name TEXT;
  v_is_first BOOLEAN;
BEGIN
  -- Idempotency: if this user already has a profile, do nothing.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NEW.email);
  v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name',''), 'My Company');

  SELECT COUNT(*) INTO user_count FROM auth.users;
  v_is_first := (user_count <= 1);

  IF v_is_first THEN
    INSERT INTO public.companies (name, email)
    VALUES ('SmartTourOS HQ', NEW.email)
    RETURNING id INTO new_company_id;
  ELSE
    INSERT INTO public.companies (name, email)
    VALUES (v_company_name, NEW.email)
    RETURNING id INTO new_company_id;
  END IF;

  -- Insert profile WITH company_id already set (no UPDATE, so the
  -- enforce_profile_immutable_fields BEFORE UPDATE trigger never fires).
  INSERT INTO public.profiles (user_id, full_name, company_id)
  VALUES (NEW.id, v_full_name, new_company_id);

  IF v_is_first THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'company_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.tracking_settings (company_id)
  VALUES (new_company_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.privacy_settings (company_id)
  VALUES (new_company_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;