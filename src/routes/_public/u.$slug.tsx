import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TourView, loadTourBundle } from "@/components/tour-view";

export const Route = createFileRoute("/_public/u/$slug")({
  ssr: false,
  component: UnbrandedTour,
});

function UnbrandedTour() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["utour", slug],
    queryFn: () => loadTourBundle(slug),
  });
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  // Hard-strip every branding signal before TourView ever sees the listing.
  const sanitized = data?.listing ? {
    ...data.listing,
    agent_name: null, agent_phone: null, agent_email: null,
    brokerage_name: null, brokerage_logo_url: null,
  } : null;
  return (
    <TourView
      listing={sanitized}
      company={null}
      tracking={data?.tracking}
      privacy={data?.privacy}
      mode="unbranded"
    />
  );
}
