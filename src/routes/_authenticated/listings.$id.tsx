import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { ListingForm, EMPTY_LISTING } from "@/components/listing-form";

export const Route = createFileRoute("/_authenticated/listings/$id")({
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { companyId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data || !companyId) {
    return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  }

  const initial = {
    ...EMPTY_LISTING,
    id: data.id,
    slug: data.slug,
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    zip: data.zip ?? "",
    price: data.price?.toString() ?? "",
    beds: data.beds?.toString() ?? "",
    baths: data.baths?.toString() ?? "",
    sqft: data.sqft?.toString() ?? "",
    description: data.description ?? "",
    hero_image_storage_path: data.hero_image_storage_path ?? null,
    gallery_storage_paths: data.gallery_storage_paths ?? [],
    primary_media_type: data.primary_media_type ?? "youtube",
    primary_media_url: data.primary_media_url ?? "",
    secondary_media_url: data.secondary_media_url ?? "",
    agent_name: data.agent_name ?? "",
    agent_phone: data.agent_phone ?? "",
    agent_email: data.agent_email ?? "",
    brokerage_name: data.brokerage_name ?? "",
    brokerage_logo_url: data.brokerage_logo_url ?? "",
    mls_number: data.mls_number ?? "",
    status: data.status,
    show_address_on_unbranded: data.show_address_on_unbranded ?? true,
  };


  return (
    <div className="container-luxe py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Edit</p>
        <h1 className="font-display text-4xl mt-2">{data.address}</h1>
      </div>
      <ListingForm initial={initial} companyId={companyId} />
    </div>
  );
}
