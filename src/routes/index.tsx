import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  PlayCircle,
  Zap,
  BarChart3,
  X,
  Check,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartTourOS — See Who Is Looking At Your Zillow Listings" },
      {
        name: "description",
        content:
          "Create a free account in 30 seconds. Turn anonymous Zillow traffic into compliant, captured buyers with MLS-safe smart tour links.",
      },
      { property: "og:title", content: "SmartTourOS — See Who Is Looking At Your Zillow Listings" },
      {
        property: "og:description",
        content:
          "Turn anonymous Zillow traffic into compliant, captured buyers with MLS-safe smart tour links.",
      },
      { property: "og:url", content: "https://smarttouros.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://smarttouros.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://smarttouros.com/#org",
              name: "SmartTourOS",
              url: "https://smarttouros.com/",
            },
            {
              "@type": "WebSite",
              "@id": "https://smarttouros.com/#website",
              url: "https://smarttouros.com/",
              name: "SmartTourOS",
              publisher: { "@id": "https://smarttouros.com/#org" },
            },
          ],
        }),
      },
    ],
  }),

  component: Landing,
});

// Page-scoped dark palette — does not touch global theme tokens.
const BG = "#0A0A0A";
const SURFACE = "#111114";
const SURFACE_2 = "#16161b";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_STRONG = "rgba(255,255,255,0.14)";
const TEXT = "#fafafa";
const MUTED = "#a3a3a3";
const PURPLE = "#8B5CF6";
const BLUE = "#3B82F6";
const GRADIENT = `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 100%)`;

const faqItems = [
  {
    question: "How does SmartTourOS identify anonymous visitors?",
    answer:
      "Our proprietary Identity Reconciliation Engine operates at the edge, leveraging geospatial telemetry and bid-stream normalization to create a deterministic identity profile. By orchestrating a multi-node handshake between first-party tag signals and Enterprise-Grade Graph-Data APIs, we resolve visitor intent with precision standard analytics cannot match.",
  },
  {
    question: "Is this just a standard virtual tour link?",
    answer:
      "No. We position our technology as a Smart Listing Bridge. Unlike passive video links, our architecture utilizes parent-child frame orchestration to operate within the listing's native embed environment, bridging the gap between Zillow session data and our identity graphs.",
  },
  {
    question: "Does this require professional 3D scans?",
    answer:
      "No. A simple, 10-second smartphone walkthrough video is all that is needed to unlock your Zillow buyer data; our system handles the formatting automatically.",
  },
  {
    question: "What is the benefit of the Lender and Title sponsorship model?",
    answer:
      "This model creates a predictable lead-generation ecosystem where lenders/title companies sponsor your account to gain co-work access to high-intent buyer leads, providing you with professional software at no cost.",
  },
];

function Landing() {
  const [conciergeOpen, setConciergeOpen] = useState(false);
  return (
    <div
      style={{ background: BG, color: TEXT, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
      className="min-h-screen antialiased relative overflow-x-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.10) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Minimal nav */}
      <header className="relative">
        <div className="container-luxe h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight"
            style={{ color: TEXT, letterSpacing: "-0.02em" }}
          >
            SmartTour<span style={{ color: MUTED }}>OS</span>
          </Link>
          <Link
            to="/auth"
            className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
            style={{ color: MUTED }}
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main>
        {/* ============ HERO ============ */}
        <section className="relative">
          <div className="container-luxe pt-20 pb-28 lg:pt-28 lg:pb-36 text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full text-xs font-medium"
              style={{
                background: "rgba(139,92,246,0.10)",
                border: `1px solid ${BORDER_STRONG}`,
                color: "#c4b5fd",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: PURPLE, boxShadow: `0 0 10px ${PURPLE}` }}
              />
              Live for agents nationwide
            </div>

            <h1
              className="mx-auto max-w-4xl font-bold tracking-tight"
              style={{
                fontSize: "clamp(2.5rem, 6.5vw, 5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                color: TEXT,
              }}
            >
              See Who Is Looking At Your{" "}
              <span
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Zillow Listings.
              </span>
            </h1>

            <p
              className="mx-auto mt-7 max-w-2xl"
              style={{ color: MUTED, fontSize: "1.125rem", lineHeight: 1.55 }}
            >
              Create a free account in 30 seconds. Turn your anonymous Zillow traffic into
              compliant, captured buyers.
            </p>

            {/* Magic input */}
            <MagicInput />

            <p className="mt-5 text-xs" style={{ color: "#737378" }}>
              100% Free · No Credit Card · MLS Compliant Unbranded Links
            </p>
            <p className="mt-2 text-xs" style={{ color: "#737378" }}>
              Don't have a video yet?{" "}
              <button
                type="button"
                onClick={() => setConciergeOpen(true)}
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer underline decoration-dashed underline-offset-4"
              >
                Click here and we'll shoot one for you within 24 hours—absolutely free.
              </button>
            </p>
          </div>
        </section>

        {/* ============ ONBOARDING 1-2-3 ============ */}
        <section className="relative">
          <div className="container-luxe py-20 lg:py-24">
            <div className="text-center mb-14">
              <p
                className="text-xs uppercase font-semibold mb-3"
                style={{ color: "#a78bfa", letterSpacing: "0.22em" }}
              >
                Bam. 1-2-3.
              </p>
              <h2
                className="font-bold mx-auto max-w-2xl"
                style={{
                  fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                From media link to captured lead in under a minute.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  icon: PlayCircle,
                  title: "Drop Your Media Link",
                  body: (
                    <>
                      Paste a YouTube walkthrough, video file, or existing tour link. No video?{" "}
                      <button
                        type="button"
                        onClick={() => setConciergeOpen(true)}
                        className="font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer underline decoration-dashed underline-offset-4"
                      >
                        Request a Free Walkthrough
                      </button>
                      {" "}— we'll come shoot a 10-second video for you within 24 hours, completely free.
                    </>
                  ),
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "Generate Compliant Link",
                  body:
                    "One click converts it into an unbranded, MLS-compliant gateway you can paste anywhere.",
                },
                {
                  step: "03",
                  icon: BarChart3,
                  title: "Capture Zillow Traffic",
                  body:
                    "Paste in your MLS. Watch anonymous Zillow views turn into real, identified leads.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="group relative rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 50px -20px rgba(139,92,246,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        border: `1px solid rgba(139,92,246,0.25)`,
                        color: "#c4b5fd",
                      }}
                    >
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: "#52525a", letterSpacing: "0.1em" }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ letterSpacing: "-0.015em" }}
                  >
                    {s.title}
                  </h3>
                  <p style={{ color: MUTED, fontSize: "0.95rem", lineHeight: 1.55 }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ COMPARISON ============ */}
        <section className="relative">
          <div className="container-luxe py-20 lg:py-28">
            <div className="text-center mb-14">
              <p
                className="text-xs uppercase font-semibold mb-3"
                style={{ color: "#60a5fa", letterSpacing: "0.22em" }}
              >
                The visual payoff
              </p>
              <h2
                className="font-bold mx-auto max-w-3xl"
                style={{
                  fontSize: "clamp(1.875rem, 3.8vw, 2.875rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                Same 223 views. Two completely different outcomes.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* The Old Way */}
              <div
                className="relative rounded-2xl p-8"
                style={{
                  background: SURFACE,
                  border: "1px solid rgba(239,68,68,0.25)",
                  boxShadow:
                    "0 0 0 1px rgba(239,68,68,0.08), 0 20px 60px -30px rgba(239,68,68,0.35)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)",
                  }}
                />
                <p
                  className="text-xs uppercase font-bold mb-4"
                  style={{ color: "#fca5a5", letterSpacing: "0.2em" }}
                >
                  The Old Way
                </p>
                <h3
                  className="text-2xl font-bold mb-7"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Zillow keeps your buyers. You pay anyway.
                </h3>
                <ul className="space-y-4">
                  {[
                    "Zillow shows 223 anonymous views — you see a counter.",
                    "Zillow sells those leads to Premier Agents in your zip.",
                    "You never see a name, email, or phone number.",
                    "Cost: lost commissions, every single month.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 items-start">
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                      <span style={{ color: MUTED, lineHeight: 1.55 }}>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The SmartTour Way */}
              <div
                className="relative rounded-2xl p-8"
                style={{
                  background: SURFACE_2,
                  border: "1px solid rgba(139,92,246,0.4)",
                  boxShadow:
                    "0 0 0 1px rgba(139,92,246,0.15), 0 20px 60px -25px rgba(139,92,246,0.5)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: GRADIENT }}
                />
                <p
                  className="text-xs uppercase font-bold mb-4"
                  style={{
                    background: GRADIENT,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "0.2em",
                  }}
                >
                  The SmartTour Way
                </p>
                <h3
                  className="text-2xl font-bold mb-7"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Same views. Routed through you. Captured forever.
                </h3>
                <ul className="space-y-4">
                  {[
                    "Those same 223 views route through your branded link first.",
                    "Buyer data lands compliantly in your SmartTour dashboard.",
                    "Household-level identity resolution — name, address, intent.",
                    "Cost: $0. Completely free to start.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 items-start">
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                        style={{
                          background: "rgba(139,92,246,0.18)",
                          color: "#c4b5fd",
                        }}
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
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200 hover:opacity-90"
                    style={{ background: GRADIENT, color: "#fff" }}
                  >
                    Start free — claim your traffic
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="relative">
          <div className="container-luxe py-20 lg:py-24">
            <h2
              className="text-center text-xs font-semibold uppercase tracking-widest mb-12"
              style={{ color: MUTED, letterSpacing: "0.22em" }}
            >
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-zinc-800">
                    <AccordionTrigger className="text-left text-sm font-medium text-zinc-200 hover:no-underline py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-zinc-400 pb-5 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderColor: BORDER }} className="border-t py-10 relative">
        <div
          className="container-luxe flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between"
          style={{ color: "#737378" }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© SmartTourOS</span>
            <span aria-hidden="true">·</span>
            <a href="/privacy" className="transition-colors duration-200 hover:text-white">Privacy</a>
            <span aria-hidden="true">•</span>
            <a href="/cookies" className="transition-colors duration-200 hover:text-white">Cookies</a>
            <span aria-hidden="true">•</span>
            <a href="/privacy-choices" className="transition-colors duration-200 hover:text-white">Privacy Choices</a>
            <span aria-hidden="true">•</span>
            <a href="/terms" className="transition-colors duration-200 hover:text-white">Terms</a>
          </div>
          <span>MLS-safe virtual tour links. Confirm local MLS rules before publishing.</span>
        </div>
      </footer>

      <ConciergeModal open={conciergeOpen} onClose={() => setConciergeOpen(false)} />
    </div>
  );
}

// ===== Concierge Onboarding Modal =====
function ConciergeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "#0e0e12",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 30px 80px -20px rgba(139,92,246,0.35)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 h-8 w-8 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-2xl font-bold tracking-tight" style={{ color: TEXT, letterSpacing: "-0.02em" }}>
          Let's get your listing on Zillow.
        </h3>
        <p className="mt-2 text-sm" style={{ color: MUTED, lineHeight: 1.55 }}>
          Give us the address. We'll shoot a quick 10-second walkthrough and generate your compliant MLS link within 24 hours. 100% Free.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Austin, TX"
            disabled={sent}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-500 focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
            style={{
              background: "#16161b",
              border: "1px solid rgba(255,255,255,0.10)",
              color: TEXT,
            }}
          />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={sent}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-500 focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
            style={{
              background: "#16161b",
              border: "1px solid rgba(255,255,255,0.10)",
              color: TEXT,
            }}
          />
          <button
            type="submit"
            disabled={sent}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-100"
            style={{
              background: sent ? "#16a34a" : GRADIENT,
              color: "#fff",
              boxShadow: "0 8px 24px -8px rgba(139,92,246,0.5)",
            }}
          >
            {sent ? (
              <>
                <Check className="h-4 w-4" />
                Request Sent!
              </>
            ) : (
              "Send Videographer"
            )}
          </button>
          <p className="text-center text-xs" style={{ color: "#737378" }}>
            We typically respond within 2 hours during business hours.
          </p>
        </form>
      </div>
    </div>
  );
}

// ===== Magic Input (visual placeholder — wires to /auth) =====
function MagicInput() {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Visual shell — hand off to auth/signup flow.
        window.location.href = "/auth";
      }}
      className="mx-auto mt-10 max-w-2xl"
    >
      <div
        className="relative rounded-2xl p-1.5 transition-all duration-200"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER_STRONG}`,
          boxShadow: value
            ? "0 0 0 3px rgba(139,92,246,0.18), 0 20px 60px -20px rgba(59,130,246,0.4)"
            : "0 10px 40px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* Subtle gradient halo on focus */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            background: GRADIENT,
            opacity: value ? 0.15 : 0,
            filter: "blur(20px)",
            zIndex: -1,
          }}
        />
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste any YouTube link (even a 10-second cell phone video)..."
            className="flex-1 bg-transparent px-4 py-3 sm:py-4 text-sm sm:text-base outline-none placeholder:text-neutral-500"
            style={{ color: TEXT }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: GRADIENT,
              color: "#fff",
              boxShadow: "0 8px 24px -8px rgba(139,92,246,0.5)",
            }}
          >
            Generate Free MLS Link
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
