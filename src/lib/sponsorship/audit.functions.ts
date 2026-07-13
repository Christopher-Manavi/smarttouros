import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSponsorshipEnabled } from "./feature-flag";

async function requireSuperAdmin(ctx: {
  supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string;
}): Promise<void> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const isSuper = ((data ?? []) as Array<{ role: string }>).some((r) => r.role === "super_admin");
  if (!isSuper) throw new Response("Not found", { status: 404 });
}

export const listAuditEvents = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        limit: z.number().int().min(1).max(500).default(200).optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("sponsorship_audit_events")
      .select("id, action, subject_type, subject_id, actor_user_id, metadata, created_at")
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
