import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSponsorshipEnabled } from "./feature-flag";
import { validateAgents, type AgentImport, type CsvRow } from "./csv";
import {
  isValidEmail,
  normalizeEmail,
  normalizeInt,
  normalizeString,
  normalizeZip,
} from "./normalize";

async function requireSuperAdmin(ctx: {
  supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string;
}): Promise<void> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const isSuper = ((data ?? []) as Array<{ role: string }>).some((r) => r.role === "super_admin");
  if (!isSuper) throw new Response("Not found", { status: 404 });
}

export const listAgents = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("sponsorship_agents")
      .select(
        "id, first_name, last_name, email, phone, brokerage, city, state, postal_code, listing_count, profile_url, created_at",
      )
      .eq("campaign_id", data.campaign_id)
      .order("email", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const singleAgentSchema = z.object({
  campaign_id: z.string().uuid(),
  first_name: z.string().trim().max(120).nullable().optional(),
  last_name: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().min(3).max(320),
  phone: z.string().trim().max(60).nullable().optional(),
  brokerage: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(120).nullable().optional(),
  postal_code: z.string().trim().max(20).nullable().optional(),
  listing_count: z.number().int().min(0).nullable().optional(),
  profile_url: z.string().trim().max(500).nullable().optional(),
});

export const addAgent = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => singleAgentSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    const email = normalizeEmail(data.email);
    if (!email || !isValidEmail(email)) throw new Error("Invalid email");
    const row = {
      campaign_id: data.campaign_id,
      first_name: normalizeString(data.first_name ?? null),
      last_name: normalizeString(data.last_name ?? null),
      email,
      phone: normalizeString(data.phone ?? null),
      brokerage: normalizeString(data.brokerage ?? null),
      city: normalizeString(data.city ?? null),
      state: normalizeString(data.state ?? null),
      postal_code: normalizeZip(data.postal_code ?? null),
      listing_count:
        data.listing_count === null || data.listing_count === undefined
          ? null
          : normalizeInt(data.listing_count),
      profile_url: normalizeString(data.profile_url ?? null),
    };
    const { data: inserted, error } = await context.supabase
      .from("sponsorship_agents")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("An agent with that email already exists in this campaign.");
      throw new Error(error.message);
    }
    await context.supabase.from("sponsorship_audit_events").insert({
      campaign_id: data.campaign_id,
      actor_user_id: context.userId,
      action: "agent.added",
      subject_type: "agent",
      subject_id: inserted.id,
      metadata: { email },
    });
    return { id: inserted.id };
  });

export const importAgentsBulk = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        rows: z.array(z.record(z.string(), z.string())).max(2000),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);

    const parsed = validateAgents(data.rows as CsvRow[]);
    if (parsed.valid.length === 0) {
      return { inserted: 0, skipped_existing: 0, errors: parsed.errors, duplicates: parsed.duplicates };
    }
    // De-dup against existing rows in the same campaign.
    const emails = parsed.valid.map((v) => v.email);
    const { data: existing } = await context.supabase
      .from("sponsorship_agents")
      .select("email")
      .eq("campaign_id", data.campaign_id)
      .in("email", emails);
    const existingSet = new Set(((existing ?? []) as Array<{ email: string }>).map((r) => r.email));
    const toInsert = parsed.valid.filter((v: AgentImport) => !existingSet.has(v.email));

    if (toInsert.length === 0) {
      return {
        inserted: 0,
        skipped_existing: parsed.valid.length,
        errors: parsed.errors,
        duplicates: parsed.duplicates,
      };
    }

    const payload = toInsert.map((a) => ({ campaign_id: data.campaign_id, ...a }));
    const { error } = await context.supabase.from("sponsorship_agents").insert(payload);
    if (error) throw new Error(error.message);

    await context.supabase.from("sponsorship_audit_events").insert({
      campaign_id: data.campaign_id,
      actor_user_id: context.userId,
      action: "agents.imported",
      subject_type: "batch",
      subject_id: null,
      metadata: {
        inserted: toInsert.length,
        skipped_existing: existingSet.size,
        errors: parsed.errors.length,
        duplicates: parsed.duplicates.length,
      },
    });
    return {
      inserted: toInsert.length,
      skipped_existing: existingSet.size,
      errors: parsed.errors,
      duplicates: parsed.duplicates,
    };
  });

export const deleteAgent = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    assertSponsorshipEnabled();
    await requireSuperAdmin(context);
    // Fetch campaign_id first for audit trail.
    const { data: existing } = await context.supabase
      .from("sponsorship_agents")
      .select("campaign_id, email")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("sponsorship_agents").delete().eq("id", data.id);
    if (error) {
      if (error.code === "23503")
        throw new Error("Cannot delete: this agent has matches. Cancel matches first.");
      throw new Error(error.message);
    }
    if (existing) {
      await context.supabase.from("sponsorship_audit_events").insert({
        campaign_id: existing.campaign_id,
        actor_user_id: context.userId,
        action: "agent.removed",
        subject_type: "agent",
        subject_id: data.id,
        metadata: { email: existing.email },
      });
    }
    return { ok: true };
  });
