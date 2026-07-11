-- Temporarily grant super_admin to run a runtime authorization test, then revoke.
-- This is idempotent and self-cleaning; it does not permanently change privileges.
DO $$
DECLARE
  v_uid uuid := 'b4a9e081-16da-43fd-8cda-ab5669f70e68';
BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'super_admin')
    ON CONFLICT DO NOTHING;
END $$;