import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartTourOS — Smart virtual tour platform for luxury real estate" },
      {
        name: "description",
        content:
          "White-label virtual tour pages with branded and MLS-safe URLs for photographers, media companies, and brokerages.",
      },
      { property: "og:title", content: "SmartTourOS" },
      { property: "og:description", content: "Smart virtual tour platform for luxury real estate." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container-luxe h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-tight">
            SmartTour<span className="text-muted-foreground">OS</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm">Get started <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </nav>
        </div>
      </header>

      <section className="container-luxe py-24 lg:py-32">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          For luxury real estate media
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.05] max-w-4xl">
          The smart virtual tour platform for modern listings.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Build elegant property tour pages, generate branded and MLS-safe URLs in one click,
          and measure every visit — without touching code.
        </p>
        <div className="mt-10 flex gap-3">
          <Link to="/auth"><Button size="lg">Create your workspace</Button></Link>
          <a href="#features"><Button size="lg" variant="outline">See features</Button></a>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container-luxe py-20 lg:py-28">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            The highest-intent click on the listing
          </p>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.1] max-w-4xl">
            Your best buyers are already clicking the tour. You just can't see them.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl">
            A virtual-tour click is not casual browsing. It is the digital showing before the showing.
            SmartTourOS helps agents capture the buyer and seller opportunity hidden inside that moment.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                stat: "99.2%",
                lead: "of submitted-offer buyers viewed the listing's virtual tour",
                body: "Before serious buyers write offers, they inspect the layout, flow, and feel of the home. The virtual tour is where passive browsing turns into real intent.",
              },
              {
                stat: "75%+",
                lead: "of these high-intent buyers also had a home to sell",
                body: "Your next buyer may also be your next listing. Tour traffic does not just reveal buyer demand — it can reveal future seller opportunity.",
              },
              {
                stat: "Invisible",
                lead: "to the agent — until now",
                body: "When tour clicks go to YouTube, Dropbox, Matterport, or generic property pages, the highest-intent audience on the listing disappears into someone else's platform.",
              },
            ].map((c) => (
              <div
                key={c.stat}
                className="rounded-xl border bg-background p-8 shadow-sm flex flex-col"
              >
                <div className="font-display text-5xl md:text-6xl leading-none tracking-tight">
                  {c.stat}
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">{c.lead}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl">
            <p className="font-display text-2xl md:text-3xl leading-snug">
              SmartTourOS turns virtual-tour clicks into buyer and seller discovery.
            </p>
            <p className="mt-3 text-muted-foreground">
              Stop losing your most valuable listing traffic. Capture the moment serious buyers raise their hand.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg">Start with one listing</Button></Link>
              <a href="mailto:hello@smarttouros.com?subject=Free%20Tour%20Audit">
                <Button size="lg" variant="outline">Request free tour audit</Button>
              </a>
            </div>
            <p className="mt-8 text-xs text-muted-foreground italic">
              Stats shown are placeholder market-research figures for positioning and will be updated with verified source data.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="border-t">
        <div className="container-luxe py-20 grid md:grid-cols-3 gap-12">
          {[
            { icon: Building2, title: "Branded & MLS-safe URLs", body: "Every listing produces both a branded tour page and an unbranded MLS-safe page automatically." },
            { icon: LineChart, title: "First-party analytics", body: "Page views, media plays, referrers, and visitor activity — captured per listing in real time." },
            { icon: ShieldCheck, title: "Tracking your way", body: "Drop in GA, Meta Pixel, GTM, or identity-resolution tags. You control where they fire." },
          ].map((f) => (
            <div key={f.title}>
              <f.icon className="h-5 w-5 mb-4" />
              <h3 className="font-display text-2xl">{f.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container-luxe flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© SmartTourOS</span>
            <span aria-hidden="true">·</span>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <span aria-hidden="true">•</span>
            <a href="/cookies" className="hover:text-foreground">Cookies</a>
            <span aria-hidden="true">•</span>
            <a href="/privacy-choices" className="hover:text-foreground">Privacy Choices</a>
            <span aria-hidden="true">•</span>
            <a href="/terms" className="hover:text-foreground">Terms</a>
          </div>
          <span>Generate MLS-safe virtual tour links. Confirm local MLS rules before publishing.</span>
        </div>
      </footer>
    </div>
  );
}
