import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SmartTourOS" },
      {
        name: "description",
        content: "SmartTourOS default privacy policy for hosted property tour pages.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SmartTourOS</p>
      <h1 className="font-display text-4xl mt-2 mb-6">Privacy Policy</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>
          SmartTourOS is a white-label virtual tour platform used by real estate photographers,
          agents, and brokerages to publish branded and MLS-safe listing pages.
        </p>
        <p>
          Public listing pages hosted on SmartTourOS may use cookies and similar technologies for
          analytics, marketing attribution, and listing performance measurement. Aggregate page
          activity (such as page views, referrer, device type, and a rotating visitor identifier) is
          recorded so the workspace owner can measure how the listing is performing.
        </p>
        <p>
          Workspace owners may inject their own analytics, advertising, or identity-resolution
          scripts on their listing pages. Those scripts are governed by the workspace owner's own
          privacy policy.
        </p>
        <p>
          This is the default SmartTourOS privacy policy. Individual workspaces may replace this
          link with their own privacy policy in their workspace settings.
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
