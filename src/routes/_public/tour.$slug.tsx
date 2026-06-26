import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TourView, loadTourBundle } from "@/components/tour-view";

export const Route = createFileRoute("/_public/tour/$slug")({
  ssr: false,
  component: BrandedTour,
});

function BrandedTour() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["tour", slug],
    queryFn: () => loadTourBundle(slug),
  });
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  return (
    <TourView
      listing={data?.listing}
      company={data?.company}
      tracking={data?.tracking}
      privacy={data?.privacy}
      mode="branded"
    />
  );
}
