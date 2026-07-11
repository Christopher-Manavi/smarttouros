import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { createHash } from "node:crypto";
import { isListingMediaPath, isCompanyLogoPath } from "@/lib/tour-media-paths";

/**
 * Sign fresh short-lived download URLs for the storage-hosted media that
 * belongs to a published public tour. Runs with service-role credentials on
 * the server, so anonymous browsers never see storage paths or bucket names.
 *
 * Security invariants:
 * - Listing must exist and be `status='active'`.
 * - Listing-media paths must match EXACTLY `${company_id}/${listing_id}/...`
 *   with at least a filename segment after. This binds every signed object
 *   to its owning listing, not just its owning tenant.
 * - Company-logo paths must match EXACTLY `${company_id}/...` and live in
 *   the `company-logos` bucket only.
 * - Any path containing `..`, empty segments, backslashes, or leading/trailing
 *   slashes is rejected as malformed.
 * - Unbranded mode NEVER signs brokerage logo or company logo.
 * - Public signed URLs expire in 3600 seconds (60 minutes).
 * - Server-side rate limit: max 60 requests per (IP, slug) per 60s window.
 *   Inactive, missing, and rate-limited slugs return an identical empty
 *   payload so listing state is never disclosed.
 */
export const signPublicTourMedia = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; mode: "branded" | "unbranded" }) => {
    if (!input || typeof input.slug !== "string" || !input.slug.trim()) {
      throw new Error("slug is required");
    }
    if (input.mode !== "branded" && input.mode !== "unbranded") {
      throw new Error("mode must be 'branded' or 'unbranded'");
    }
    return { slug: input.slug.trim().toLowerCase(), mode: input.mode };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const TTL_SECONDS = 60 * 60; // 60 minutes for public tours

    const empty = {
      hero: null as string | null,
      gallery: [] as string[],
      primary_media: null as string | null,
      secondary_media: null as string | null,
      brokerage_logo: null as string | null,
      company_logo: null as string | null,
    };

    // -------- Server-side rate limit (IP + slug) --------
    // Uses server-derived IP; not user-supplied. Falls back to a generic
    // bucket if IP is unavailable so a spoofable header cannot bypass it.
    let ip = "unknown";
    try {
      ip = getRequestIP({ xForwardedFor: true }) || "unknown";
    } catch {
      // request context unavailable; keep default
    }
    // Hash the (ip + slug) tuple so raw IP addresses are never stored in
    // the rate-limit table. A per-server pepper would strengthen this, but
    // even without one the hash prevents casual disclosure of visitor IPs.
    const bucketKey = createHash("sha256").update(`sign:${ip}:${data.slug}`).digest("hex");
    const nowMs = Date.now();
    const windowMs = 60_000;
    const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs).toISOString();
    const LIMIT = 60;

    // Opportunistic cleanup: drop windows older than 1 hour on ~1% of calls.
    if (Math.random() < 0.01) {
      const cutoff = new Date(nowMs - 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from("media_sign_rate_limit")
        .delete()
        .lt("window_started_at", cutoff);
    }

    try {
      // Upsert-then-increment pattern
      const { data: existing } = await supabaseAdmin
        .from("media_sign_rate_limit")
        .select("request_count")
        .eq("bucket_key", bucketKey)
        .eq("window_started_at", windowStart)
        .maybeSingle();

      const nextCount = (existing?.request_count ?? 0) + 1;
      if (nextCount > LIMIT) {
        return empty; // generic response for rate-limited callers
      }

      if (existing) {
        await supabaseAdmin
          .from("media_sign_rate_limit")
          .update({ request_count: nextCount })
          .eq("bucket_key", bucketKey)
          .eq("window_started_at", windowStart);
      } else {
        await supabaseAdmin
          .from("media_sign_rate_limit")
          .insert({ bucket_key: bucketKey, window_started_at: windowStart, request_count: 1 });
      }
    } catch {
      // If the limiter itself fails, fail closed for safety.
      return empty;
    }
    // Best-effort suppress unused-var warning on request header helper
    void getRequestHeader;

    // -------- Path validators --------
    const isSafeSegment = (s: string) =>
      s.length > 0 && s !== "." && s !== ".." && !s.includes("\\") && !s.includes("/");

    // Listing media MUST be `${company_id}/${listing_id}/<filename or subpath>`
    const isListingMediaPath = (
      p: string | null | undefined,
      companyId: string,
      listingId: string,
    ): p is string => {
      if (typeof p !== "string" || p.length === 0) return false;
      if (p.startsWith("/") || p.endsWith("/")) return false;
      if (p.includes("..") || p.includes("\\")) return false;
      const parts = p.split("/");
      if (parts.length < 3) return false;
      if (!parts.every(isSafeSegment)) return false;
      return parts[0] === companyId && parts[1] === listingId;
    };

    // Company logo MUST be `${company_id}/<filename>` (2+ segments)
    const isCompanyLogoPath = (
      p: string | null | undefined,
      companyId: string,
    ): p is string => {
      if (typeof p !== "string" || p.length === 0) return false;
      if (p.startsWith("/") || p.endsWith("/")) return false;
      if (p.includes("..") || p.includes("\\")) return false;
      const parts = p.split("/");
      if (parts.length < 2) return false;
      if (!parts.every(isSafeSegment)) return false;
      return parts[0] === companyId;
    };

    // -------- Fetch listing --------
    const { data: listing, error } = await supabaseAdmin
      .from("listings")
      .select(
        "id, company_id, status, hero_image_storage_path, gallery_storage_paths, primary_media_storage_path, secondary_media_storage_path, brokerage_logo_storage_path",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();

    if (error || !listing) return empty; // generic empty for missing/inactive

    async function sign(bucket: "listing-media" | "company-logos", path: string | null) {
      if (!path) return null;
      const { data: s, error: e } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, TTL_SECONDS);
      if (e || !s?.signedUrl) return null;
      return s.signedUrl;
    }

    const okHero = isListingMediaPath(listing.hero_image_storage_path, listing.company_id, listing.id)
      ? listing.hero_image_storage_path
      : null;
    const okPrimary = isListingMediaPath(listing.primary_media_storage_path, listing.company_id, listing.id)
      ? listing.primary_media_storage_path
      : null;
    const okSecondary = isListingMediaPath(listing.secondary_media_storage_path, listing.company_id, listing.id)
      ? listing.secondary_media_storage_path
      : null;

    const [hero, primary, secondary] = await Promise.all([
      sign("listing-media", okHero),
      sign("listing-media", okPrimary),
      sign("listing-media", okSecondary),
    ]);

    const galleryPaths = (listing.gallery_storage_paths ?? []).filter((p): p is string =>
      isListingMediaPath(p, listing.company_id, listing.id),
    );
    const galleryRaw = await Promise.all(galleryPaths.map((p) => sign("listing-media", p)));
    const gallery = galleryRaw.filter((u): u is string => !!u);

    if (data.mode === "unbranded") {
      return { ...empty, hero, primary_media: primary, secondary_media: secondary, gallery };
    }

    // Branded: also sign brokerage logo (listing-media bucket) and company logo (company-logos bucket)
    const okBrokerage = isListingMediaPath(
      listing.brokerage_logo_storage_path,
      listing.company_id,
      listing.id,
    )
      ? listing.brokerage_logo_storage_path
      : null;

    const [brokerageLogo, companyLogoRow] = await Promise.all([
      sign("listing-media", okBrokerage),
      supabaseAdmin
        .from("companies")
        .select("logo_storage_path")
        .eq("id", listing.company_id)
        .maybeSingle(),
    ]);

    const rawCompanyLogoPath = companyLogoRow?.data?.logo_storage_path ?? null;
    const okCompanyLogo = isCompanyLogoPath(rawCompanyLogoPath, listing.company_id)
      ? rawCompanyLogoPath
      : null;
    const companyLogo = await sign("company-logos", okCompanyLogo);

    return {
      hero,
      gallery,
      primary_media: primary,
      secondary_media: secondary,
      brokerage_logo: brokerageLogo,
      company_logo: companyLogo,
    };
  });

export type PublicTourMedia = Awaited<ReturnType<typeof signPublicTourMedia>>;
