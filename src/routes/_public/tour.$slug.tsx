import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TourView, loadTourBundle } from "@/components/tour-view";

export const Route = createFileRoute("/_public/tour/$slug")({
  ssr: false,
  head: ({ params }) => {
    const url = `https://smarttouros.com/tour/${params.slug}`;
    const title = `Property Tour — ${params.slug} | SmartTourOS`;
    const description = `Explore the branded virtual tour for listing ${params.slug} on SmartTourOS: media, photos, and agent contact.`;
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
            name: `Property Tour ${params.slug}`,
            url,
            description,
            brand: { "@type": "Organization", name: "SmartTourOS" },
          }),
        },
      ],
    };
  },
  component: BrandedTour,
});

function BrandedTour() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["tour", slug],
    queryFn: () => loadTourBundle(slug, "branded"),
  });
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
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
