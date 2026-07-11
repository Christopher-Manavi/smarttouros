import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TourView, loadTourBundle } from "@/components/tour-view";

export const Route = createFileRoute("/_public/u/$slug")({
  ssr: false,
  head: ({ params }) => {
    const url = `https://smarttouros.com/u/${params.slug}`;
    const title = `Unbranded Property Tour — ${params.slug} | SmartTourOS`;
    const description = `MLS-safe unbranded virtual tour for listing ${params.slug}. No agent or brokerage branding.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `Unbranded Property Tour ${params.slug}`,
            url,
            description,
          }),
        },
      ],
    };
  },
  component: UnbrandedTour,
});

function UnbrandedTour() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["utour", slug],
    queryFn: () => loadTourBundle(slug),
  });
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  // Hard-strip every branding signal before TourView ever sees the listing.
  const sanitized = data?.listing
    ? {
        ...data.listing,
        agent_name: null,
        agent_phone: null,
        agent_email: null,
        brokerage_name: null,
        brokerage_logo_url: null,
      }
    : null;
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
