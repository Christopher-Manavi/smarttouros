import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy-choices")({
  head: () => ({
    meta: [
      { title: "Your Privacy Choices — SmartTourOS" },
      {
        name: "description",
        content: "Manage your privacy choices for SmartTourOS-hosted listing pages.",
      },
    ],
  }),
  component: PrivacyChoicesPage,
});

function PrivacyChoicesPage() {
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SmartTourOS</p>
      <h1 className="font-display text-4xl mt-2 mb-6">Your Privacy Choices</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>
          SmartTourOS respects opt-out signals where applicable. If you would like to limit how
          analytics and marketing technologies are used on a specific listing page, you can:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Enable your browser's Global Privacy Control (GPC) signal</li>
          <li>Block third-party cookies in your browser settings</li>
          <li>
            Contact the workspace owner of the listing page directly to request that your
            information not be used
          </li>
        </ul>
        <p>
          A workspace owner may replace this link with their own privacy choices page in their
          workspace settings.
        </p>
        <p className="pt-6">
          <Link to="/" className="underline">
            Back to SmartTourOS
          </Link>
        </p>
      </div>
    </div>
  );
}
