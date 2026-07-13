import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin } from "./server-helpers";

export const listAuditEvents = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("sponsorship_audit_events")
      .select(
        "id, event_type, actor_type, actor_user_id, match_id, sanitized_metadata, created_at",
      )
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
