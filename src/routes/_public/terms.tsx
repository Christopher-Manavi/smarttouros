import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({ meta: [{ title: "Terms — SmartTourOS" }, { name: "description", content: "SmartTourOS default terms of use for hosted property tour pages." }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SmartTourOS</p>
      <h1 className="font-display text-4xl mt-2 mb-6">Terms of Use</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>SmartTourOS provides hosting and presentation tools for real estate listing tour pages. Listing content (photos, video, descriptions, address, agent details) is provided by the workspace owner who created the listing and is their responsibility.</p>
        <p>Listing pages are provided on an as-is basis. SmartTourOS is not the listing broker, the seller, or the buyer's agent for any property displayed on a hosted page.</p>
        <p>Workspace owners are responsible for complying with their local MLS rules, fair-housing laws, and applicable advertising regulations. Use the MLS-safe unbranded URL when posting a virtual tour link in MLS fields.</p>
        <p>This is the default SmartTourOS terms page. Individual workspaces may replace this link with their own terms in their workspace settings.</p>
        <p className="pt-6"><Link to="/" className="underline">Back to SmartTourOS</Link></p>
      </div>
    </div>
  );
}
