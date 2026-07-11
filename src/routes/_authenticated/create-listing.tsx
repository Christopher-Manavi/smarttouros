import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "@/lib/use-auth";
import { EMPTY_LISTING, ListingForm } from "@/components/listing-form";
import { normalizeYouTubeUrl, isYouTubeUrl } from "@/components/media-embed";

const search = z.object({ yt: z.string().optional() });

export const Route = createFileRoute("/_authenticated/create-listing")({
  validateSearch: search,
  component: NewListing,
});

function NewListing() {
  const { companyId } = useAuth();
  const { yt } = Route.useSearch();

  const prefillUrl = yt && isYouTubeUrl(yt) ? (normalizeYouTubeUrl(yt) ?? yt) : "";
  const initial = prefillUrl
    ? { ...EMPTY_LISTING, primary_media_type: "youtube", primary_media_url: prefillUrl }
    : EMPTY_LISTING;

  return (
    <div className="container-luxe py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New</p>
        <h1 className="font-display text-4xl mt-2">Create listing</h1>
      </div>
      {companyId ? (
        <ListingForm initial={initial} companyId={companyId} highlightMedia={!!prefillUrl} />
      ) : (
        <p className="text-muted-foreground">Loading your workspace…</p>
      )}
    </div>
  );
}
