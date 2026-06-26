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
        <div className="container-luxe flex justify-between text-xs text-muted-foreground">
          <span>© SmartTourOS</span>
          <span>Generate MLS-safe virtual tour links. Confirm local MLS rules before publishing.</span>
        </div>
      </footer>
    </div>
  );
}
