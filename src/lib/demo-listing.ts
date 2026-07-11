import { supabase } from "@/integrations/supabase/client";
import { slugify, uniqueSuffix } from "@/lib/slug";

export const DEMO_MLS = "DEMO12345";
export const DEMO_PLACEHOLDER_MEDIA = "https://www.youtube.com/embed/aqz-KE-bpKQ";

export type DemoCreateResult = { id: string; slug: string };

export async function createDemoListing(
  companyId: string,
  opts?: { primaryMediaUrl?: string },
): Promise<DemoCreateResult> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const isSuper = (roleRows ?? []).some((r) => r.role === "super_admin");
  if (!isSuper) throw new Error("Not authorized");
  const slug = `${slugify("12349 longmire trace conroe tx")}-${uniqueSuffix()}`;
  const payload = {
    company_id: companyId,
    address: "12349 Longmire Trace",
    city: "Conroe",
    state: "TX",
    zip: "77304",
    price: 1250000,
    beds: 5,
    baths: 4.5,
    sqft: 4250,
    description:
      "Luxury Lake Conroe area residence with cinematic media, aerial views, and premium listing presentation.",
    primary_media_type: "iframe" as const,
    primary_media_url: opts?.primaryMediaUrl?.trim() || DEMO_PLACEHOLDER_MEDIA,
    agent_name: "Demo Agent",
    agent_phone: "936-555-0100",
    agent_email: "demo@example.com",
    brokerage_name: "Demo Brokerage",
    mls_number: DEMO_MLS,
    status: "active" as const,
    slug,
    show_address_on_unbranded: true,
    gallery_urls: [] as string[],
  };
  const { data, error } = await supabase
    .from("listings")
    .insert(payload)
    .select("id, slug")
    .single();
  if (error) throw error;
  return { id: data.id, slug: data.slug };
}

import { brandedTourUrl, unbrandedTourUrl } from "@/lib/public-url";

export function tourUrls(slug: string) {
  return {
    branded: brandedTourUrl(slug),
    unbranded: unbrandedTourUrl(slug),
  };
}
