import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { EMPTY_LISTING, ListingForm } from "@/components/listing-form";

export const Route = createFileRoute("/_authenticated/listings/new")({
  component: NewListing,
});

export function NewListing() {
  const { companyId } = useAuth();
  return (
    <div className="container-luxe py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New</p>
        <h1 className="font-display text-4xl mt-2">Create listing</h1>
      </div>
      {companyId ? (
        <ListingForm initial={EMPTY_LISTING} companyId={companyId} />
      ) : (
        <p className="text-muted-foreground">Loading your workspace…</p>
      )}
    </div>
  );
}
