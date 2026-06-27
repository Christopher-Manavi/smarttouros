import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Zap, Gift, X, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartTourOS — Smart Virtual Tour Platform for Real Estate" },
      {
        name: "description",
        content:
          "SmartTourOS turns virtual-tour clicks into buyer and seller discovery with MLS-safe smart tour pages, listing analytics, and household-level follow-up opportunities.",
      },
      { property: "og:title", content: "SmartTourOS — Smart Virtual Tour Platform for Real Estate" },
      {
        property: "og:description",
        content:
          "SmartTourOS turns virtual-tour clicks into buyer and seller discovery with MLS-safe smart tour pages, listing analytics, and household-level follow-up opportunities.",
      },
      { property: "og:url", content: "https://smarttouros.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://smarttouros.com/" }],
  }),
  component: Landing,
});

// Page-scoped dark palette — does not touch global theme tokens.
const BG = "#0b0b0d";
const SURFACE = "#121214";
const SURFACE_2 = "#17171b";
const BORDER = "#26262c";
const INDIGO = "#6366f1";
const INDIGO_HOVER = "#4f46e5";
const TEXT = "#f5f5f7";
const MUTED = "#9a9aa3";

function Landing() {
  return (
    <div style={{ background: BG, color: TEXT }} className="min-h-screen font-sans antialiased">
      {/* Nav */}
      <header style={{ borderColor: BORDER }} className="border-b">
        <div className="container-luxe h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-tight" style={{ color: TEXT }}>
            SmartTour<span style={{ color: MUTED }}>OS</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/auth"
              className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ color: TEXT }}
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-md transition-colors"
              style={{ background: INDIGO, color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-luxe py-24 lg:py-32">
        <p
          className="text-xs uppercase mb-6"
          style={{ color: MUTED, letterSpacing: "0.24em" }}
        >
          Stop the lead leak
        </p>
        <h1
          className="font-display max-w-5xl"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5.25rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: 600,
          }}
        >
          Why are you paying to send your best buyers to someone else's platform?
        </h1>
        <p
          className="mt-8 max-w-3xl"
          style={{ color: MUTED, fontSize: "1.15rem", lineHeight: 1.6 }}
        >
          99% of serious buyers engage with the virtual tour. Stop losing that intent.
          Resolve your leads instantly, capture their identity, and own your listing data.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors"
            style={{ background: INDIGO, color: "#fff", letterSpacing: "0.02em" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
          >
            Claim your listings <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md border transition-colors"
            style={{ borderColor: BORDER, color: TEXT, background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Value props */}
      <section
        id="how"
        style={{ borderColor: BORDER, background: SURFACE }}
        className="border-y"
      >
        <div className="container-luxe py-24">
          <p
            className="text-xs uppercase mb-5"
            style={{ color: MUTED, letterSpacing: "0.24em" }}
          >
            The new standard for listing media
          </p>
          <h2
            className="font-display max-w-4xl"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              fontWeight: 600,
            }}
          >
            Your tour traffic is your most valuable audience. Treat it that way.
          </h2>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "Zero-Leak Conversion",
                body:
                  "Stop traffic from leaking to YouTube, Matterport, or Dropbox. Every click stays on your branded, MLS-safe domain — where you control the experience and the data.",
              },
              {
                icon: Zap,
                title: "Instant Lead Resolution",
                body:
                  "We turn anonymous clicks into identified buyer profiles the moment they interact with your tour. Household-level intent, delivered before your competition even knows the buyer exists.",
              },
              {
                icon: Gift,
                title: "Premium Media, Zero Cost",
                body:
                  "Get your professional media package — photography, video, virtual tour — fully integrated and included. Marketing assets plus lead capture, for the price you already pay for a tour.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-8 flex flex-col"
                style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="h-10 w-10 rounded-md flex items-center justify-center mb-6"
                  style={{ background: "rgba(99,102,241,0.12)", color: INDIGO }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3
                  className="font-display text-2xl mb-3"
                  style={{ letterSpacing: "-0.01em", fontWeight: 600 }}
                >
                  {f.title}
                </h3>
                <p style={{ color: MUTED, lineHeight: 1.6, fontSize: "0.95rem" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Math of Your Listing */}
      <section className="container-luxe py-24 lg:py-32">
        <p
          className="text-xs uppercase mb-5"
          style={{ color: MUTED, letterSpacing: "0.24em" }}
        >
          Conversion math
        </p>
        <h2
          className="font-display max-w-4xl"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 600,
          }}
        >
          The Math of Your Listing.
        </h2>
        <p className="mt-5 max-w-2xl" style={{ color: MUTED, fontSize: "1.05rem", lineHeight: 1.6 }}>
          Same listing. Same tour. Two completely different outcomes.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {/* Old way */}
          <div
            className="rounded-xl p-8"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p
              className="text-xs uppercase mb-4"
              style={{ color: MUTED, letterSpacing: "0.2em" }}
            >
              The Old Way
            </p>
            <h3
              className="font-display text-3xl mb-6"
              style={{ letterSpacing: "-0.01em", fontWeight: 600 }}
            >
              Pay to send leads to someone else.
            </h3>
            <ul className="space-y-4">
              {[
                "Tour link points to YouTube, Matterport, or a hosted PDF.",
                "Buyer leaves your branded experience within seconds.",
                "Third-party platform captures the session — you don't.",
                "Anonymous click. No name, no household, no follow-up.",
                "You pay for the media. Someone else owns the audience.",
              ].map((line) => (
                <li key={line} className="flex gap-3 items-start">
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                    style={{ background: "rgba(255,80,80,0.12)", color: "#ff6b6b" }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                  <span style={{ color: MUTED, lineHeight: 1.55 }}>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SmartTourOS way */}
          <div
            className="rounded-xl p-8 relative overflow-hidden"
            style={{
              background: SURFACE_2,
              border: `1px solid ${INDIGO}`,
              boxShadow: "0 0 0 1px rgba(99,102,241,0.25), 0 24px 60px -20px rgba(99,102,241,0.35)",
            }}
          >
            <p
              className="text-xs uppercase mb-4"
              style={{ color: INDIGO, letterSpacing: "0.2em", fontWeight: 600 }}
            >
              The SmartTourOS Way
            </p>
            <h3
              className="font-display text-3xl mb-6"
              style={{ letterSpacing: "-0.01em", fontWeight: 600 }}
            >
              Capture, resolve, and own every lead.
            </h3>
            <ul className="space-y-4">
              {[
                "Every tour link routes through your branded, MLS-safe domain.",
                "Buyer stays in your experience from first click to last frame.",
                "Session, referrer, and engagement captured in your dashboard.",
                "Anonymous clicks resolve to household-level buyer profiles.",
                "You own the media, the audience, and the next conversation.",
              ].map((line) => (
                <li key={line} className="flex gap-3 items-start">
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                    style={{ background: "rgba(99,102,241,0.18)", color: INDIGO }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span style={{ color: TEXT, lineHeight: 1.55 }}>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-md transition-colors"
                style={{ background: INDIGO, color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
              >
                Switch the math <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <p
          className="mt-10 text-xs italic max-w-2xl"
          style={{ color: MUTED }}
        >
          Engagement figures shown are placeholder market-research positioning and will be updated with verified source data.
        </p>
      </section>

      {/* Closing CTA */}
      <section style={{ borderColor: BORDER, background: SURFACE }} className="border-t">
        <div className="container-luxe py-20 text-center">
          <h2
            className="font-display max-w-3xl mx-auto"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              fontWeight: 600,
            }}
          >
            Your next listing is your next lead engine. Stop giving it away.
          </h2>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors"
              style={{ background: INDIGO, color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
            >
              Start with one listing <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:hello@smarttouros.com?subject=Free%20Tour%20Audit"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md border transition-colors"
              style={{ borderColor: BORDER, color: TEXT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Request free tour audit
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderColor: BORDER }} className="border-t py-10">
        <div
          className="container-luxe flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between"
          style={{ color: MUTED }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© SmartTourOS</span>
            <span aria-hidden="true">·</span>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <span aria-hidden="true">•</span>
            <a href="/cookies" className="hover:text-white">Cookies</a>
            <span aria-hidden="true">•</span>
            <a href="/privacy-choices" className="hover:text-white">Privacy Choices</a>
            <span aria-hidden="true">•</span>
            <a href="/terms" className="hover:text-white">Terms</a>
          </div>
          <span>Generate MLS-safe virtual tour links. Confirm local MLS rules before publishing.</span>
        </div>
      </footer>
    </div>
  );
}
