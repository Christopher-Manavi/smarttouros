import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/cookies")({
  head: () => ({ meta: [{ title: "Cookie Notice — SmartTourOS" }, { name: "description", content: "How SmartTourOS uses cookies and similar technologies on hosted listing pages." }] }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SmartTourOS</p>
      <h1 className="font-display text-4xl mt-2 mb-6">Cookie Notice</h1>
      <div className="prose prose-sm text-muted-foreground space-y-4">
        <p>SmartTourOS-hosted listing pages may set cookies or use similar browser storage to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Measure listing page views and unique visitors</li>
          <li>Attribute traffic to referrers, UTM campaigns, and marketing sources</li>
          <li>Power analytics, advertising, or identity-resolution scripts that a workspace owner has chosen to install on their listing pages</li>
        </ul>
        <p>Workspace owners may replace this link with their own cookie notice in their workspace settings.</p>
        <p className="pt-6"><Link to="/" className="underline">Back to SmartTourOS</Link></p>
      </div>
    </div>
  );
}
