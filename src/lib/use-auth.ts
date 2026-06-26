import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "company_admin" | "agent";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  companyId: string | null;
  roles: Role[];
  fullName: string | null;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setCompanyId(null);
      setRoles([]);
      setFullName(null);
      return;
    }
    const uid = session.user.id;
    (async () => {
      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("company_id, full_name").eq("user_id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setCompanyId(profile?.company_id ?? null);
      setFullName(profile?.full_name ?? null);
      setRoles((roleRows ?? []).map((r) => r.role as Role));
    })();
  }, [session?.user?.id]);

  return {
    session,
    user: session?.user ?? null,
    loading,
    companyId,
    roles,
    fullName,
  };
}
