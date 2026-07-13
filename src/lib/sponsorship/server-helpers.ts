/**
 * Shared server helpers for sponsorship_* functions.
 * Every server function calls requireSuperAdmin() + assertSponsorshipEnabled()
 * FIRST — RLS is the ultimate backstop, never the only line of defense.
 */
import { assertSponsorshipEnabled } from "./feature-flag";

// Loose supabase typing keeps this helper decoupled from the generated
// Database types (which don't yet include sponsorship_* rows).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupaLike = any;

export async function requireSuperAdmin(ctx: { supabase: SupaLike; userId: string }): Promise<void> {
  assertSponsorshipEnabled();
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const rows = (data ?? []) as Array<{ role: string }>;
  if (!rows.some((r) => r.role === "super_admin")) {
    throw new Response("Not found", { status: 404 });
  }
}

export type AuditInput = {
  campaign_id: string | null;
  match_id?: string | null;
  actor_user_id: string;
  event_type: string;
  metadata?: Record<string, unknown>;
};

/**
 * Sanitize metadata: strip anything that looks like a secret before writing.
 * Only allow primitive strings/numbers/booleans/nulls and simple objects.
 */
function sanitize(m: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!m) return {};
  const out: Record<string, unknown> = {};
  const bad = /^(password|secret|token|api[_-]?key|bearer)$/i;
  for (const [k, v] of Object.entries(m)) {
    if (bad.test(k)) continue;
    if (v === null || v === undefined) {
      out[k] = null;
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 200);
    } else if (typeof v === "object") {
      out[k] = JSON.parse(JSON.stringify(v));
    }
  }
  return out;
}

export async function writeAudit(supabase: SupaLike, input: AuditInput): Promise<void> {
  await supabase.from("sponsorship_audit_events").insert({
    campaign_id: input.campaign_id,
    match_id: input.match_id ?? null,
    actor_type: "super_admin",
    actor_user_id: input.actor_user_id,
    event_type: input.event_type,
    sanitized_metadata: sanitize(input.metadata),
  });
}
