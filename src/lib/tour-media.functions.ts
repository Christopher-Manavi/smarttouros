import { createServerFn } from "@tanstack/react-start";

/**
 * Sign fresh short-lived download URLs for the storage-hosted media that
 * belongs to a published public tour. Runs with service-role credentials on
 * the server, so anonymous browsers never see storage paths or bucket names.
 *
 * Security invariants:
 * - Listing must exist and be `status='active'`.
 * - Only paths whose first folder segment matches the listing's own
 *   `company_id` are ever signed. This prevents a compromised row from
 *   pointing at another tenant's media.
 * - Branded mode returns agent/brokerage/company logo signatures.
 * - Unbranded mode returns ONLY listing-owned assets. It never signs
 *   brokerage logo or company logo — those are branded-only artefacts.
 * - Signed URLs expire in 60 minutes.
 */
export const signPublicTourMedia = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; mode: "branded" | "unbranded" }) => {
    if (!input || typeof input.slug !== "string" || !input.slug.trim()) {
      throw new Error("slug is required");
    }
    if (input.mode !== "branded" && input.mode !== "unbranded") {
      throw new Error("mode must be 'branded' or 'unbranded'");
    }
    return { slug: input.slug.trim(), mode: input.mode };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const TTL_SECONDS = 60 * 60; // 60 minutes

    const empty = {
      hero: null as string | null,
      gallery: [] as string[],
      primary_media: null as string | null,
      secondary_media: null as string | null,
      brokerage_logo: null as string | null,
      company_logo: null as string | null,
    };

    const { data: listing, error } = await supabaseAdmin
      .from("listings")
      .select(
        "id, company_id, status, hero_image_storage_path, gallery_storage_paths, primary_media_storage_path, secondary_media_storage_path, brokerage_logo_storage_path",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();

    if (error || !listing) return empty;

    const companyPrefix = `${listing.company_id}/`;
    const ownedByListing = (p: string | null | undefined): p is string =>
      typeof p === "string" && p.startsWith(companyPrefix);

    async function sign(bucket: "listing-media" | "company-logos", path: string | null) {
      if (!path) return null;
      const { data: s, error: e } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, TTL_SECONDS);
      if (e || !s?.signedUrl) return null;
      return s.signedUrl;
    }

    // Listing-owned assets (safe in both modes)
    const [hero, primary, secondary] = await Promise.all([
      ownedByListing(listing.hero_image_storage_path)
        ? sign("listing-media", listing.hero_image_storage_path)
        : Promise.resolve(null),
      ownedByListing(listing.primary_media_storage_path)
        ? sign("listing-media", listing.primary_media_storage_path)
        : Promise.resolve(null),
      ownedByListing(listing.secondary_media_storage_path)
        ? sign("listing-media", listing.secondary_media_storage_path)
        : Promise.resolve(null),
    ]);

    const galleryPaths = (listing.gallery_storage_paths ?? []).filter(ownedByListing);
    const gallery = await Promise.all(galleryPaths.map((p) => sign("listing-media", p)));

    if (data.mode === "unbranded") {
      return {
        ...empty,
        hero,
        primary_media: primary,
        secondary_media: secondary,
        gallery: gallery.filter((u): u is string => !!u),
      };
    }

    // Branded: also sign brokerage logo and company logo
    const [brokerageLogo, companyLogoRow] = await Promise.all([
      ownedByListing(listing.brokerage_logo_storage_path)
        ? sign("listing-media", listing.brokerage_logo_storage_path)
        : Promise.resolve(null),
      supabaseAdmin
        .from("companies")
        .select("logo_storage_path")
        .eq("id", listing.company_id)
        .maybeSingle(),
    ]);

    const companyLogoPath =
      typeof companyLogoRow?.data?.logo_storage_path === "string" &&
      companyLogoRow.data.logo_storage_path.startsWith(companyPrefix)
        ? companyLogoRow.data.logo_storage_path
        : null;
    const companyLogo = await sign("company-logos", companyLogoPath);

    return {
      hero,
      gallery: gallery.filter((u): u is string => !!u),
      primary_media: primary,
      secondary_media: secondary,
      brokerage_logo: brokerageLogo,
      company_logo: companyLogo,
    };
  });

export type PublicTourMedia = Awaited<ReturnType<typeof signPublicTourMedia>>;
