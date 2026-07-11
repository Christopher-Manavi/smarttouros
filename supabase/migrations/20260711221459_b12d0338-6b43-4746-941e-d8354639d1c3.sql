-- =====================================================================
-- Security Hardening Pass 2 — Migration A: Tenant isolation
-- =====================================================================

-- 1. Tighten profiles UPDATE policy: user may update own row, but
--    the trigger below enforces that only "safe" fields may change.
DROP POLICY IF EXISTS "user updates own profile" ON public.profiles;

CREATE POLICY "user updates own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. BEFORE UPDATE trigger: reject changes to protected fields unless
--    the caller is service_role or a verified super_admin.
--
-- Protected columns on public.profiles (inventory taken 2026-07-11):
--   id, user_id, company_id, full_name, created_at, updated_at
--
-- Allowed ordinary updates: full_name (personal display field).
-- Everything else is protected. `updated_at` is set by trg_profiles_updated.
CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS TRIGGER
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

  -- Ordinary authenticated user path: block every non-allowlisted field.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles.id is immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'profiles.user_id is immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'profiles.company_id can only be changed by an administrator'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'profiles.created_at is immutable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_immutable_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_profiles_immutable ON public.profiles;
CREATE TRIGGER trg_profiles_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_immutable_fields();

-- 3. Belt-and-suspenders lockdown of user_roles.
--    Existing policy only allows super_admin ALL; explicit REVOKE ensures
--    that even a mistaken future GRANT wouldn't hand privilege escalation.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

COMMENT ON FUNCTION public.enforce_profile_immutable_fields() IS
  'Pass 2: prevents ordinary users from moving themselves to another company or changing identity fields. Only service_role or super_admin bypasses.';
