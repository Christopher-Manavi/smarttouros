import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin, writeAudit } from "./server-helpers";
import { normalizeZipList } from "./normalize";

const campaignInputSchema = z.object({
  campaign_name: z.string().trim().min(1).max(200),
  market_city: z.string().trim().max(120).nullable().optional(),
  market_state: z.string().trim().max(120).nullable().optional(),
  zip_codes: z.array(z.string()).max(500).optional(),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context);
    const { data, error } = await context.supabase
      .from("sponsorship_campaigns")
      .select("id, campaign_name, market_city, market_state, zip_codes, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      campaign_name: string;
      market_city: string | null;
      market_state: string | null;
      zip_codes: string[];
      status: string;
      created_at: string;
    }>;
  });

export const getCampaign = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: row, error } = await context.supabase
      .from("sponsorship_campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Response("Not found", { status: 404 });
    return row as {
      id: string;
      campaign_name: string;
      market_city: string | null;
      market_state: string | null;
      zip_codes: string[];
      status: string;
      created_by: string | null;
      feature_flag_snapshot: boolean;
      created_at: string;
      updated_at: string;
    };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => campaignInputSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const zips = normalizeZipList(data.zip_codes ?? []);
    const { data: row, error } = await context.supabase
      .from("sponsorship_campaigns")
      .insert({
        campaign_name: data.campaign_name,
        market_city: data.market_city ?? null,
        market_state: data.market_state ?? null,
        zip_codes: zips,
        status: "draft",
        created_by: context.userId,
      })
      .select("id, campaign_name")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: row.id,
      actor_user_id: context.userId,
      event_type: "campaign.created",
      metadata: { campaign_name: row.campaign_name },
    });
    return row as { id: string; campaign_name: string };
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    campaignInputSchema.extend({ id: z.string().uuid() }).parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { id, ...patch } = data;
    const zips = normalizeZipList(patch.zip_codes ?? []);
    const { error } = await context.supabase
      .from("sponsorship_campaigns")
      .update({
        campaign_name: patch.campaign_name,
        market_city: patch.market_city ?? null,
        market_state: patch.market_state ?? null,
        zip_codes: zips,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: id,
      actor_user_id: context.userId,
      event_type: "campaign.updated",
      metadata: { patch: { ...patch, zip_codes: zips } },
    });
    return { ok: true };
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
    await requireSuperAdmin(context);
    const { error } = await context.supabase
      .from("sponsorship_campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: data.id,
      actor_user_id: context.userId,
      event_type: "campaign.status_changed",
      metadata: { status: data.status },
    });
    return { ok: true };
  });
