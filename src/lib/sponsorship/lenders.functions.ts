import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin, writeAudit } from "./server-helpers";
import { validateLenders, type CsvRow, type LenderImport } from "./csv";
import {
  isValidEmail,
  isValidNmls,
  normalizeEmail,
  normalizeInt,
  normalizeString,
  normalizeZipList,
} from "./normalize";

export const listLenders = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("sponsorship_lenders")
      .select(
        "id, first_name, last_name, email, phone, company, nmls_number, city, state, service_areas, service_zip_codes, max_current_sponsorships, created_at",
      )
      .eq("campaign_id", data.campaign_id)
      .order("email", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const singleLenderSchema = z.object({
  campaign_id: z.string().uuid(),
  first_name: z.string().trim().max(120).nullable().optional(),
  last_name: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().min(3).max(320),
  phone: z.string().trim().max(60).nullable().optional(),
  company: z.string().trim().max(200).nullable().optional(),
  nmls_number: z.string().trim().max(20).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(120).nullable().optional(),
  service_areas: z.array(z.string().trim().max(200)).max(200).optional(),
  service_zip_codes: z.array(z.string().trim().max(20)).max(500).optional(),
  max_current_sponsorships: z.number().int().min(0).max(1000).optional(),
});

export const addLender = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => singleLenderSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const email = normalizeEmail(data.email);
    if (!email || !isValidEmail(email)) throw new Error("Invalid email");
    if (data.nmls_number && !isValidNmls(data.nmls_number))
      throw new Error("Invalid NMLS number");
    const row = {
      campaign_id: data.campaign_id,
      first_name: normalizeString(data.first_name ?? null),
      last_name: normalizeString(data.last_name ?? null),
      email,
      phone: normalizeString(data.phone ?? null),
      company: normalizeString(data.company ?? null),
      nmls_number: normalizeString(data.nmls_number ?? null),
      city: normalizeString(data.city ?? null),
      state: normalizeString(data.state ?? null),
      service_areas: (data.service_areas ?? []).filter(Boolean),
      service_zip_codes: normalizeZipList(data.service_zip_codes ?? []),
      max_current_sponsorships: normalizeInt(data.max_current_sponsorships ?? 5) ?? 5,
    };
    const { data: inserted, error } = await context.supabase
      .from("sponsorship_lenders")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505")
        throw new Error("A lender with that email already exists in this campaign.");
      throw new Error(error.message);
    }
    await writeAudit(context.supabase, {
      campaign_id: data.campaign_id,
      actor_user_id: context.userId,
      event_type: "lender.added",
      metadata: { email, lender_id: inserted.id },
    });
    return { id: inserted.id };
  });

export const importLendersBulk = createServerFn({ method: "POST" })
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
    await requireSuperAdmin(context);
    const parsed = validateLenders(data.rows as CsvRow[]);
    if (parsed.valid.length === 0) {
      return {
        inserted: 0,
        skipped_existing: 0,
        errors: parsed.errors,
        duplicates: parsed.duplicates,
      };
    }
    const emails = parsed.valid.map((v) => v.email);
    const { data: existing } = await context.supabase
      .from("sponsorship_lenders")
      .select("email")
      .eq("campaign_id", data.campaign_id)
      .in("email", emails);
    const existingSet = new Set(
      ((existing ?? []) as Array<{ email: string }>).map((r) => r.email),
    );
    const toInsert: LenderImport[] = parsed.valid.filter((v) => !existingSet.has(v.email));
    if (toInsert.length === 0) {
      return {
        inserted: 0,
        skipped_existing: parsed.valid.length,
        errors: parsed.errors,
        duplicates: parsed.duplicates,
      };
    }
    const payload = toInsert.map((l) => ({ campaign_id: data.campaign_id, ...l }));
    const { error } = await context.supabase.from("sponsorship_lenders").insert(payload);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      campaign_id: data.campaign_id,
      actor_user_id: context.userId,
      event_type: "lenders.imported",
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

export const deleteLender = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context);
    const { data: existing } = await context.supabase
      .from("sponsorship_lenders")
      .select("campaign_id, email")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("sponsorship_lenders").delete().eq("id", data.id);
    if (error) {
      if (error.code === "23503")
        throw new Error("Cannot delete: this lender has matches. Cancel matches first.");
      throw new Error(error.message);
    }
    if (existing) {
      await writeAudit(context.supabase, {
        campaign_id: existing.campaign_id,
        actor_user_id: context.userId,
        event_type: "lender.removed",
        metadata: { email: existing.email, lender_id: data.id },
      });
    }
    return { ok: true };
  });
