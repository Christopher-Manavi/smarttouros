import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSponsorshipEnabledClient } from "@/lib/sponsorship/feature-flag";

/**
 * Pathless layout that gates every child route on:
 *   1. authenticated (already enforced by parent `_authenticated`)
 *   2. VITE_SPONSORSHIP_ENGINE_ENABLED === "true"
 *   3. caller has the `super_admin` role
 *
 * Any failure redirects to /dashboard. Ordinary tenants therefore cannot
 * discover the module exists even by URL guessing — the sidebar link is
 * also hidden by the same client flag.
 */
export const Route = createFileRoute("/_authenticated/_super_admin")({
  beforeLoad: async () => {
    if (!isSponsorshipEnabledClient()) throw redirect({ to: "/dashboard" });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const isSuper = (roles ?? []).some((r) => r.role === "super_admin");
    if (!isSuper) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
