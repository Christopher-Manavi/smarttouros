
-- Lock down SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;

-- Replace permissive event insert policies with validated ones
DROP POLICY IF EXISTS "anon inserts events" ON public.events;
DROP POLICY IF EXISTS "authenticated inserts events" ON public.events;

CREATE POLICY "anon inserts validated events" ON public.events FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = events.listing_id
        AND l.status = 'active'
        AND l.company_id = events.company_id
    )
  );

CREATE POLICY "authenticated inserts validated events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = events.listing_id
        AND l.company_id = events.company_id
    )
  );
