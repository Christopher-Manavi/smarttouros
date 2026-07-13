import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSponsorshipEnabled } from "./feature-flag";

/**
 * Server-side super_admin gate.
 * Throws a 404-shaped Response when the caller is not super_admin, so the
 * module is indistinguishable from "does not exist" for ordinary tenants.
 * Every sponsorship server function calls this first — RLS is the ultimate
 * backstop but we never depend on RLS alone.
 */
async function requireSuperAdmin(ctx: {
  supabase: {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => Promise<{ data: unknown }>;
      };
    };
  };
  userId: string;
}): Promise<void> {
  const { data } = (await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)) as { data: Array<{ role: string }> | null };
  const isSuper = (data ?? []).some((r) => r.role === "super_admin");
  if (!isSuper) {
    throw new Response("Not found", { status: 404 });
  }
}

async function writeAudit(
  supabase: ReturnType<typeof Object> extends never ? never : any, // eslint-disable-line @typescript-eslint/no-explicit-any
  input: {
    campaign_id: string | null;
    actor_user_id: string;
    action: string;
    subject_type: "campaign" | "agent" | "lender" | "match" | "batch";
    subject_id: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("sponsorship_audit_events").insert({
    campaign_id: input.campaign_id,
    actor_user_id: input.actor_user_id,
    action: input.action,
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    metadata: input.metadata ?? {},
  });
}

const campaignInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  region: z.string().trim().max(200).optional().nullable(),
  annual_price_cents: z.number().int().min(0).max(10_000_000),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { data, error } = await context.supabase
      .from("sponsorship_campaigns")
      .select("id, name, region, annual_price_cents, status, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCampaign = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { data: row, error } = await context.supabase
      .from("sponsorship_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Response("Not found", { status: 404 });
    return row;
  });

export const createCampaign = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => campaignInputSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { data: row, error } = await context.supabase
      .from("sponsorship_campaigns")
      .insert({
        name: data.name,
        region: data.region ?? null,
        annual_price_cents: data.annual_price_cents,
        notes: data.notes ?? null,
        created_by: context.userId,
        status: "draft",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: row.id,
      actor_user_id: context.userId,
      action: "campaign.created",
      subject_type: "campaign",
      subject_id: row.id,
      metadata: { name: row.name, region: row.region },
    });
    return row;
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    campaignInputSchema.extend({ id: z.string().uuid() }).parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase
      .from("sponsorship_campaigns")
      .update({
        name: patch.name,
        region: patch.region ?? null,
        annual_price_cents: patch.annual_price_cents,
        notes: patch.notes ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: id,
      actor_user_id: context.userId,
      action: "campaign.updated",
      subject_type: "campaign",
      subject_id: id,
      metadata: { patch },
    });
    return row;
  });

export const setCampaignStatus = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "matching", "review", "sending_agents", "closed", "archived"]),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { error } = await context.supabase
      .from("sponsorship_campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: data.id,
      actor_user_id: context.userId,
      action: "campaign.status_changed",
      subject_type: "campaign",
      subject_id: data.id,
      metadata: { status: data.status },
    });
    return { ok: true };
  });
