import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin, writeAudit } from "./server-helpers";
import { NON_TERMINAL_STATUSES, type SponsorshipMatchStatus } from "./status";
import { proposeMatches, type MatchAgent, type MatchLender } from "./matching";
import { renderMatchEmailPreviews } from "./email-preview-path";

export const listMatches = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("sponsorship_matches")
      .select(
        "id, agent_id, lender_id, status, annual_price_cents, created_at, updated_at, sponsorship_agents(email, first_name, last_name, city, state, postal_code, brokerage, listing_count), sponsorship_lenders(email, first_name, last_name, company, city, state)",
      )
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const previewMatches = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const [agentsRes, lendersRes, matchesRes] = await Promise.all([
      context.supabase
        .from("sponsorship_agents")
        .select("id, email, city, state, postal_code")
        .eq("campaign_id", data.campaign_id),
      context.supabase
        .from("sponsorship_lenders")
        .select("id, email, city, state, service_zip_codes, max_current_sponsorships")
        .eq("campaign_id", data.campaign_id),
      context.supabase
        .from("sponsorship_matches")
        .select("id, agent_id, lender_id, status")
        .eq("campaign_id", data.campaign_id),
    ]);
    if (agentsRes.error) throw new Error(agentsRes.error.message);
    if (lendersRes.error) throw new Error(lendersRes.error.message);
    if (matchesRes.error) throw new Error(matchesRes.error.message);

    const agents = ((agentsRes.data ?? []) as MatchAgent[]).filter((a) => !!a.email);
    const rawLenders = (lendersRes.data ?? []) as Omit<MatchLender, "current_load">[];
    const existingMatches = (matchesRes.data ?? []) as Array<{
      agent_id: string;
      lender_id: string;
      status: SponsorshipMatchStatus;
    }>;

    const loadByLender = new Map<string, number>();
    const alreadyMatched = new Set<string>();
    for (const m of existingMatches) {
      if ((NON_TERMINAL_STATUSES as readonly string[]).includes(m.status)) {
        loadByLender.set(m.lender_id, (loadByLender.get(m.lender_id) ?? 0) + 1);
        alreadyMatched.add(m.agent_id);
      }
    }
    const lenders: MatchLender[] = rawLenders.map((l) => ({
      ...l,
      current_load: loadByLender.get(l.id) ?? 0,
    }));
    const proposals = proposeMatches(agents, lenders, alreadyMatched);
    return {
      proposals,
      totals: {
        agents: agents.length,
        lenders: lenders.length,
        already_matched: alreadyMatched.size,
        proposed: proposals.length,
        unmatchable: agents.length - alreadyMatched.size - proposals.length,
      },
    };
  });

export const previewMatchEmails = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ campaign_id: z.string().uuid(), match_id: z.string().uuid() }).parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: row, error } = await context.supabase
      .from("sponsorship_matches")
      .select(
        "id, annual_price_cents, sponsorship_agents(first_name, last_name, brokerage, city, state, listing_count), sponsorship_lenders(first_name, last_name, company)",
      )
      .eq("campaign_id", data.campaign_id)
      .eq("id", data.match_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Match not found");
    return renderMatchEmailPreviews(row);
  });

export const commitMatches = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        annual_price_cents: z.number().int().min(0).max(10_000_000),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const [agentsRes, lendersRes, matchesRes] = await Promise.all([
      context.supabase
        .from("sponsorship_agents")
        .select("id, email, city, state, postal_code")
        .eq("campaign_id", data.campaign_id),
      context.supabase
        .from("sponsorship_lenders")
        .select("id, email, city, state, service_zip_codes, max_current_sponsorships")
        .eq("campaign_id", data.campaign_id),
      context.supabase
        .from("sponsorship_matches")
        .select("agent_id, lender_id, status")
        .eq("campaign_id", data.campaign_id),
    ]);
    if (agentsRes.error) throw new Error(agentsRes.error.message);
    if (lendersRes.error) throw new Error(lendersRes.error.message);
    if (matchesRes.error) throw new Error(matchesRes.error.message);

    const agents = (agentsRes.data ?? []) as MatchAgent[];
    const rawLenders = (lendersRes.data ?? []) as Omit<MatchLender, "current_load">[];
    const existingMatches = (matchesRes.data ?? []) as Array<{
      agent_id: string;
      lender_id: string;
      status: SponsorshipMatchStatus;
    }>;

    const loadByLender = new Map<string, number>();
    const alreadyMatched = new Set<string>();
    for (const m of existingMatches) {
      if ((NON_TERMINAL_STATUSES as readonly string[]).includes(m.status)) {
        loadByLender.set(m.lender_id, (loadByLender.get(m.lender_id) ?? 0) + 1);
        alreadyMatched.add(m.agent_id);
      }
    }
    const lenders: MatchLender[] = rawLenders.map((l) => ({
      ...l,
      current_load: loadByLender.get(l.id) ?? 0,
    }));
    const proposals = proposeMatches(agents, lenders, alreadyMatched);
    if (proposals.length === 0) return { inserted: 0, skipped: 0 };

    let inserted = 0;
    let skipped = 0;
    for (const p of proposals) {
      const { data: row, error } = await context.supabase
        .from("sponsorship_matches")
        .insert({
          campaign_id: data.campaign_id,
          agent_id: p.agent_id,
          lender_id: p.lender_id,
          status: "ready",
          annual_price_cents: data.annual_price_cents,
        })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") {
          skipped += 1;
        } else {
          throw new Error(error.message);
        }
      } else {
        inserted += 1;
        await writeAudit(context.supabase, {
          campaign_id: data.campaign_id,
          match_id: row.id,
          actor_user_id: context.userId,
          event_type: "match.created",
          metadata: {
            agent_id: p.agent_id,
            lender_id: p.lender_id,
            rank_reason: p.rank_reason,
            annual_price_cents: data.annual_price_cents,
          },
        });
      }
    }
    await writeAudit(context.supabase, {
      campaign_id: data.campaign_id,
      actor_user_id: context.userId,
      event_type: "matches.committed",
      metadata: { inserted, skipped, proposed: proposals.length },
    });
    return { inserted, skipped };
  });

export const setMatchStatus = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "draft",
          "ready",
          "agent_invitation_pending",
          "agent_invited",
          "agent_viewed",
          "agent_accepted",
          "agent_declined",
          "lender_notification_pending",
          "lender_notified",
          "lender_viewed",
          "payment_pending",
          "paid",
          "active",
          "expired",
          "reassigned",
          "cancelled",
        ]),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: prior } = await context.supabase
      .from("sponsorship_matches")
      .select("campaign_id, status")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("sponsorship_matches")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) {
      if (error.code === "23505")
        throw new Error(
          "That agent already has an active or in-flight sponsorship match. Cancel the other match first.",
        );
      throw new Error(error.message);
    }
    if (prior) {
      await writeAudit(context.supabase, {
        campaign_id: prior.campaign_id,
        match_id: data.id,
        actor_user_id: context.userId,
        event_type: "match.status_changed",
        metadata: { from: prior.status, to: data.status },
      });
    }
    return { ok: true };
  });
