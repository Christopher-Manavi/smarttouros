import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Zap, Gift, X, Check, AlertTriangle, Radar } from "lucide-react";
import { useState } from "react";

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

      {/* Listing Leak Visualizer */}
      <LeakVisualizer />


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

// ===== Listing Leak Visualizer =====
function LeakVisualizer() {
  const [url, setUrl] = useState("");
  const [diagnosed, setDiagnosed] = useState(false);




  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    setDiagnosed(true);
  };

  return (
    <section style={{ background: BG, borderColor: BORDER }} className="border-t border-b relative overflow-hidden">
      {/* scanline backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)",
        }}
      />
      <div className="container-luxe py-24 relative">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-semibold"
            style={{
              background: "rgba(255,107,107,0.12)",
              color: "#ff8a8a",
              border: "1px solid rgba(255,107,107,0.35)",
              letterSpacing: "0.18em",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ff6b6b", boxShadow: "0 0 8px #ff6b6b" }} />
            Live Listing Diagnostic
          </span>
        </div>
        <h2
          className="font-display max-w-4xl"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 600,
          }}
        >
          Where Your Buyers Actually Go.
        </h2>
        <p className="mt-5 max-w-2xl" style={{ color: MUTED, fontSize: "1.05rem", lineHeight: 1.6 }}>
          Paste any active listing. We'll show you, in real time, where the buyer demand leaks
          out of your funnel — and what an owned audience layer would have captured instead.
        </p>

        {/* Diagnostic input */}
        <form
          onSubmit={handleDiagnose}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl"
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.zillow.com/homedetails/..."
            className="flex-1 px-4 py-3 rounded-md text-sm outline-none transition-colors"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              color: TEXT,
            }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-md transition-colors"
            style={{ background: INDIGO, color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
          >
            <Radar className="h-4 w-4" /> Run Leak Diagnosis
          </button>
        </form>

        {/* Lead Routing Flowchart — two paths */}
        <div className="mt-14 grid lg:grid-cols-2 gap-5">
          <FlowPath
            tone="leak"
            badge="Path 1 · The Zillow Leak"
            icon={<AlertTriangle className="h-4 w-4" />}
            nodes={[
              { label: "The Buyer", sub: "High-intent search", size: "sm" },
              { label: "ZILLOW", sub: "Third-party portal", size: "xl" },
              { label: "Your Listing", sub: "Rendered on zillow.com", size: "sm" },
              { label: "Zillow's CRM", sub: "Buyer identity captured — by them", size: "sm" },
            ]}
            result={{
              title: "Zillow sells YOUR buyer back to YOU.",
              sub: "Premier Agent · $$$ per lead · recurring",
            }}
          />
          <FlowPath
            tone="own"
            badge="Path 2 · The SmartTourOS Way"
            icon={<ShieldCheck className="h-4 w-4" />}
            nodes={[
              { label: "The Buyer", sub: "High-intent search", size: "sm" },
              { label: "SmartTourOS", sub: "Your branded tour layer", size: "xl" },
              { label: "Your Listing", sub: "On your owned domain", size: "sm" },
              { label: "Your CRM", sub: "Identity resolved & synced", size: "sm" },
            ]}
            result={{
              title: "You capture and own the buyer for FREE.",
              sub: "$0 lead cost · 100% audience ownership",
            }}
          />
        </div>

        {/* Core insight card */}
        <div
          className="mt-10 rounded-xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-6"
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
          }}
        >
          <div
            className="h-12 w-12 shrink-0 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,107,107,0.12)", color: "#ff8a8a" }}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p
              className="font-display"
              style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              99% of virtual tour engagement is never captured in your CRM.
            </p>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              You already have the traffic. You are not capturing the identity. SmartTourOS fixes this at the source.
            </p>
          </div>
        </div>

        {/* Diagnosis result (revealed after submit) */}
        {diagnosed && (
          <div
            className="mt-6 rounded-xl p-6 lg:p-8"
            style={{
              background: SURFACE_2,
              border: `1px solid ${BORDER}`,
              animation: "resolveIn 0.5s ease-out both",
            }}
          >
            <p className="text-[10px] uppercase font-semibold mb-3" style={{ color: INDIGO, letterSpacing: "0.22em" }}>
              Listing Diagnosis · System Generated
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <DiagStat label="Estimated lost buyers" value="180 – 240" />
              <DiagStat label="Your current capture" value="0 – 3%" sub="untracked" />
              <DiagStat label="Top-performing benchmark" value="12 – 18%" sub="of tour viewers" />
            </div>
            <p className="mt-5 text-xs" style={{ color: MUTED }}>
              Result based on industry virtual-tour engagement benchmarks. Connect this listing to SmartTourOS to convert estimates into resolved households.
            </p>
          </div>
        )}

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-colors"
            style={{ background: INDIGO, color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = INDIGO_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = INDIGO)}
          >
            Claim Your Listings <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md border transition-colors"
            style={{ borderColor: BORDER, color: TEXT }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            See Your Lead Leak
          </a>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md border transition-colors"
            style={{ borderColor: BORDER, color: MUTED }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Start with one listing
          </Link>
        </div>

        <p className="mt-6 text-xs italic max-w-2xl" style={{ color: MUTED }}>
          SmartTourOS is not a virtual tour tool. It is a listing audience ownership system.
        </p>
      </div>

      {/* Local keyframes — page-scoped */}
      <style>{`
        @keyframes resolveIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -32; }
        }
        @keyframes flowPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes nodeGlow {
          0%, 100% { box-shadow: 0 0 0 1px var(--node-ring), 0 0 28px -6px var(--node-glow); }
          50%      { box-shadow: 0 0 0 1px var(--node-ring), 0 0 48px -4px var(--node-glow); }
        }
      `}</style>
    </section>
  );
}

type FlowNode = { label: string; sub: string; size: "sm" | "xl" };

function FlowPath({
  tone,
  badge,
  icon,
  nodes,
  result,
}: {
  tone: "leak" | "own";
  badge: string;
  icon: React.ReactNode;
  nodes: FlowNode[];
  result: { title: string; sub: string };
}) {
  const accent = tone === "leak" ? "#ff6b6b" : INDIGO;
  const accentSoft = tone === "leak" ? "rgba(255,107,107,0.18)" : "rgba(99,102,241,0.22)";
  const accentRing = tone === "leak" ? "rgba(255,107,107,0.45)" : "rgba(99,102,241,0.55)";
  const accentGlow = tone === "leak" ? "rgba(255,107,107,0.55)" : "rgba(99,102,241,0.6)";

  return (
    <div
      className="rounded-2xl p-6 lg:p-8 relative overflow-hidden backdrop-blur-xl"
      style={{
        background:
          tone === "leak"
            ? "radial-gradient(120% 70% at 50% 0%, rgba(255,107,107,0.10), transparent 60%), linear-gradient(180deg, rgba(22,20,23,0.85), rgba(17,15,18,0.9))"
            : "radial-gradient(120% 70% at 50% 0%, rgba(99,102,241,0.14), transparent 60%), linear-gradient(180deg, rgba(21,21,27,0.85), rgba(17,17,24,0.9))",
        border: `1px solid ${accentRing}`,
        boxShadow: `0 0 0 1px ${accentSoft}, 0 30px 80px -30px ${accentGlow}`,
      }}
    >
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span
          className="inline-flex items-center gap-2 text-[10px] uppercase font-semibold"
          style={{ color: accent, letterSpacing: "0.22em" }}
        >
          {icon} {badge}
        </span>
      </div>

      <div className="space-y-2 relative z-10">
        {nodes.map((n, i) => (
          <div key={n.label}>
            <FlowNodeCard node={n} accent={accent} accentRing={accentRing} accentGlow={accentGlow} delay={i * 0.12} />
            {i < nodes.length - 1 && <FlowConnector accent={accent} />}
          </div>
        ))}
      </div>

      <div
        className="mt-6 rounded-xl p-5 relative z-10"
        style={{
          background:
            tone === "leak"
              ? "linear-gradient(180deg, rgba(255,107,107,0.16), rgba(255,107,107,0.06))"
              : "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(34,197,94,0.06))",
          border: `1px solid ${tone === "leak" ? "rgba(255,107,107,0.55)" : "rgba(34,197,94,0.55)"}`,
        }}
      >
        <div className="flex items-start gap-3">
          {tone === "leak" ? (
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#ff8a8a" }} />
          ) : (
            <Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#86efac" }} />
          )}
          <div>
            <p
              className="font-display"
              style={{
                fontSize: "1.15rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: tone === "leak" ? "#ffb3b3" : "#bbf7d0",
              }}
            >
              {result.title}
            </p>
            <p className="mt-1 text-xs font-mono" style={{ color: MUTED }}>{result.sub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowNodeCard({
  node,
  accent,
  accentRing,
  accentGlow,
  delay,
}: {
  node: FlowNode;
  accent: string;
  accentRing: string;
  accentGlow: string;
  delay: number;
}) {
  const isHero = node.size === "xl";
  return (
    <div
      className="rounded-xl px-4 flex items-center justify-between"
      style={
        {
          padding: isHero ? "1.1rem 1.25rem" : "0.75rem 1rem",
          background: isHero
            ? `linear-gradient(180deg, ${accent}22, ${accent}0a)`
            : "rgba(255,255,255,0.025)",
          border: `1px solid ${isHero ? accentRing : BORDER}`,
          animation: isHero ? "nodeGlow 2.6s ease-in-out infinite" : `resolveIn 0.5s ${delay}s both ease-out`,
          ["--node-ring" as string]: accentRing,
          ["--node-glow" as string]: accentGlow,
        } as React.CSSProperties
      }
    >
      <div>
        <p
          className={isHero ? "font-display" : "font-mono"}
          style={{
            color: isHero ? accent : TEXT,
            fontSize: isHero ? "1.6rem" : "0.875rem",
            fontWeight: isHero ? 700 : 500,
            letterSpacing: isHero ? "0.04em" : "0",
            textShadow: isHero ? `0 0 24px ${accentGlow}` : "none",
          }}
        >
          {node.label}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{node.sub}</p>
      </div>
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: accent, boxShadow: `0 0 10px ${accentGlow}` }}
      />
    </div>
  );
}

function FlowConnector({ accent }: { accent: string }) {
  return (
    <div className="flex justify-center" aria-hidden>
      <svg width="24" height="34" viewBox="0 0 24 34" className="my-0.5">
        <defs>
          <linearGradient id={`g-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accent} stopOpacity="1" />
          </linearGradient>
        </defs>
        <line
          x1="12" y1="0" x2="12" y2="24"
          stroke={accent} strokeOpacity="0.25" strokeWidth="2"
        />
        <line
          x1="12" y1="0" x2="12" y2="24"
          stroke={accent} strokeWidth="2"
          strokeDasharray="6 10"
          style={{ animation: "flowDash 1.2s linear infinite, flowPulse 2s ease-in-out infinite", filter: `drop-shadow(0 0 4px ${accent})` }}
        />
        <polygon points="6,22 18,22 12,32" fill={accent} style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
      </svg>
    </div>
  );
}


function DiagStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-md p-4"
      style={{ background: BG, border: `1px solid ${BORDER}` }}
    >
      <p className="text-[10px] uppercase mb-2" style={{ color: MUTED, letterSpacing: "0.18em" }}>{label}</p>
      <p className="font-display text-2xl" style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}
