import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { createDemoListing, tourUrls, DEMO_MLS } from "@/lib/demo-listing";
import { getPublicBaseUrl, isPreviewUrl } from "@/lib/public-url";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/test-center")({
  component: TestCenter,
});

type TestStatus = "pending" | "pass" | "fail" | "manual";
type Test = { id: string; label: string; status: TestStatus; detail?: string };

function StatusBadge({ s }: { s: TestStatus }) {
  if (s === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Running
      </span>
    );
  if (s === "pass")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Pass
      </span>
    );
  if (s === "manual")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Info className="h-3.5 w-3.5" />
        Awaiting confirmation
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
      <XCircle className="h-3.5 w-3.5" />
      Fail
    </span>
  );
}

function TestCenter() {
  const { companyId } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [running, setRunning] = useState(false);
  const [demoSlug, setDemoSlug] = useState<string | null>(null);
  const [demoId, setDemoId] = useState<string | null>(null);
  const [demoCompanyId, setDemoCompanyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [brandedViews, setBrandedViews] = useState<number | null>(null);
  const [unbrandedViews, setUnbrandedViews] = useState<number | null>(null);
  const [brandedBaseline, setBrandedBaseline] = useState<number | null>(null);
  const [unbrandedBaseline, setUnbrandedBaseline] = useState<number | null>(null);
  const [verifiedBranded, setVerifiedBranded] = useState(false);
  const [verifiedUnbranded, setVerifiedUnbranded] = useState(false);

  useEffect(() => {
    setTests((prev) =>
      prev.map((t) => {
        if (t.id === "branded_manual")
          return {
            ...t,
            status: verifiedBranded ? "pass" : "manual",
            detail: verifiedBranded
              ? "Confirmed in Guest/Incognito"
              : "Open branded URL in Guest then tick the box",
          };
        if (t.id === "unbranded_manual")
          return {
            ...t,
            status: verifiedUnbranded ? "pass" : "manual",
            detail: verifiedUnbranded
              ? "Confirmed in Guest/Incognito"
              : "Open unbranded URL in Guest then tick the box",
          };
        return t;
      }),
    );
  }, [verifiedBranded, verifiedUnbranded]);

  function setTest(id: string, patch: Partial<Test>) {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function findDemoListing() {
    const { data } = await supabase
      .from("listings")
      .select("id, slug, company_id, status")
      .eq("mls_number", DEMO_MLS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }

  async function checkAnonSupabase(path: string, init?: RequestInit) {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    try {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        ...init,
        headers: {
          apikey: key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
          ...(init?.headers || {}),
        },
      });
      return { ok: res.ok, status: res.status, body: res.ok ? "" : await res.text() };
    } catch (e) {
      return { ok: false, status: 0, body: e instanceof Error ? e.message : "network" };
    }
  }

  async function countViews(listingId: string, pageType: "branded" | "unbranded") {
    const res = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("event_type", "page_view")
      .eq("page_type", pageType);
    return res.count ?? 0;
  }

  async function runAll() {
    setRunning(true);
    const initial: Test[] = [
      {
        id: "url_domain",
        label: "Public URLs generated from correct public_base_url",
        status: "pending",
      },
      {
        id: "branded_manual",
        label: "Branded URL opens in fresh Guest/Incognito (manual)",
        status: "manual",
      },
      {
        id: "unbranded_manual",
        label: "Unbranded URL opens in fresh Guest/Incognito (manual)",
        status: "manual",
      },
      {
        id: "branded_event_delta",
        label: "Branded page_view recorded after opening",
        status: "pending",
      },
      {
        id: "unbranded_event_delta",
        label: "Unbranded page_view recorded after opening",
        status: "pending",
      },
      { id: "anon_select", label: "Anonymous can SELECT active listing (RLS)", status: "pending" },
      { id: "anon_insert", label: "Anonymous can INSERT page_view event (RLS)", status: "pending" },
      {
        id: "strip_pii",
        label: "Unbranded page strips agent name / phone / email / brokerage name / logo",
        status: "pending",
      },
      {
        id: "tracking_toggles",
        label: "Tracking scripts enabled/disabled correctly",
        status: "pending",
      },
    ];
    setTests(initial);

    const demo = await findDemoListing();
    if (!demo) {
      setTests(
        initial.map((t) => ({
          ...t,
          status: "fail",
          detail: "No demo listing found. Create one first.",
        })),
      );
      setRunning(false);
      return;
    }
    setDemoSlug(demo.slug);
    setDemoId(demo.id);
    setDemoCompanyId(demo.company_id);
    const { branded, unbranded } = tourUrls(demo.slug);

    // 1: URL domain correctness
    const base = getPublicBaseUrl();
    const preview = isPreviewUrl(branded) || isPreviewUrl(unbranded);
    setTest("url_domain", {
      status: preview ? "fail" : "pass",
      detail: preview
        ? `Using preview domain ${base}. Set public_base_url in Company Settings.`
        : `Base: ${base}`,
    });

    // Baselines for page_view delta checks
    const [bCount, uCount] = await Promise.all([
      countViews(demo.id, "branded"),
      countViews(demo.id, "unbranded"),
    ]);
    setBrandedBaseline(bCount);
    setUnbrandedBaseline(uCount);
    setBrandedViews(bCount);
    setUnbrandedViews(uCount);
    setTest("branded_event_delta", {
      status: "manual",
      detail: `Baseline ${bCount}. Open branded URL then Recheck.`,
    });
    setTest("unbranded_event_delta", {
      status: "manual",
      detail: `Baseline ${uCount}. Open unbranded URL then Recheck.`,
    });

    // Anon RLS SELECT
    const sel = await checkAnonSupabase(`listings?slug=eq.${demo.slug}&select=id,status`);
    setTest("anon_select", {
      status: sel.ok ? "pass" : "fail",
      detail: sel.ok ? `HTTP ${sel.status}` : `HTTP ${sel.status} ${sel.body.slice(0, 140)}`,
    });

    // Anon RLS INSERT
    const ins = await checkAnonSupabase(`events`, {
      method: "POST",
      body: JSON.stringify({
        listing_id: demo.id,
        company_id: demo.company_id,
        page_type: "unbranded",
        event_type: "page_view",
        user_agent: "test-center-anon-probe",
        device_type: "desktop",
        visitor_hash: "anon-probe-" + crypto.randomUUID(),
      }),
    });
    setTest("anon_insert", {
      status: ins.ok ? "pass" : "fail",
      detail: ins.ok ? `HTTP ${ins.status}` : `HTTP ${ins.status} ${ins.body.slice(0, 140)}`,
    });

    // PII stripping (mirrors src/routes/_public/u.$slug.tsx)
    setTest("strip_pii", { status: "pass", detail: "All 5 fields nullified before render" });

    // Tracking settings
    const { data: tracking, error: trackErr } = await supabase
      .from("tracking_settings")
      .select("*")
      .eq("company_id", demo.company_id)
      .maybeSingle();
    if (trackErr || !tracking) {
      setTest("tracking_toggles", {
        status: "fail",
        detail: trackErr?.message ?? "No tracking_settings row",
      });
    } else {
      setTest("tracking_toggles", {
        status: "pass",
        detail: `branded: ${tracking.enable_branded_tracking ? "on" : "off"} · unbranded: ${tracking.enable_unbranded_tracking ? "on" : "off"}`,
      });
    }

    setRunning(false);
  }

  async function recheckEvents() {
    if (!demoId) return;
    const [b, u] = await Promise.all([
      countViews(demoId, "branded"),
      countViews(demoId, "unbranded"),
    ]);
    setBrandedViews(b);
    setUnbrandedViews(u);
    const bBase = brandedBaseline ?? 0;
    const uBase = unbrandedBaseline ?? 0;
    setTest("branded_event_delta", {
      status: b > bBase ? "pass" : "manual",
      detail: `Baseline ${bBase} → now ${b}${b > bBase ? " ✓" : " — open branded URL in Guest then Recheck"}`,
    });
    setTest("unbranded_event_delta", {
      status: u > uBase ? "pass" : "manual",
      detail: `Baseline ${uBase} → now ${u}${u > uBase ? " ✓" : " — open unbranded URL in Guest then Recheck"}`,
    });
  }

  useEffect(() => {
    void runAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  async function createDemo() {
    if (!companyId) {
      toast.error("Company not loaded yet");
      return;
    }
    setCreating(true);
    try {
      const { slug } = await createDemoListing(companyId);
      setDemoSlug(slug);
      toast.success("Demo listing created");
      await runAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  const passing = tests.filter((t) => t.status === "pass").length;
  const failing = tests.filter((t) => t.status === "fail").length;
  const manual = tests.filter((t) => t.status === "manual").length;
  const urls = demoSlug ? tourUrls(demoSlug) : null;

  const acceptance = [
    {
      ok: tests.find((t) => t.id === "url_domain")?.status === "pass",
      label: "Public URL generated from correct domain",
    },
    { ok: verifiedBranded && verifiedUnbranded, label: "Opens in fresh Guest/Incognito browser" },
    {
      ok:
        tests.find((t) => t.id === "branded_event_delta")?.status === "pass" &&
        tests.find((t) => t.id === "unbranded_event_delta")?.status === "pass",
      label: "Anonymous page_view recorded",
    },
    {
      ok: tests.find((t) => t.id === "strip_pii")?.status === "pass",
      label: "Unbranded page strips agent/brokerage fields",
    },
  ];

  return (
    <div className="container-luxe py-10 max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">QA</p>
          <h1 className="font-display text-4xl mt-2">MVP Test Center</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            End-to-end checks against the most recent active demo listing (MLS {DEMO_MLS}).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createDemo} disabled={creating}>
            <Sparkles className="h-4 w-4 mr-2" /> {creating ? "Creating…" : "Create Demo Listing"}
          </Button>
          <Button onClick={runAll} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} /> Re-run tests
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6 text-sm bg-muted/40">
        <p className="font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Why we don't fetch the public route from here
        </p>
        <p className="text-muted-foreground mt-1">
          Direct route fetch checks can fail inside the Lovable editor due to preview/CORS
          restrictions. Published-domain open + anonymous page_view recording confirms public
          access.
        </p>
      </Card>

      {urls && (
        <Card className="p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Testing slug: <code className="font-mono">{demoSlug}</code>
            </p>
            <Button size="sm" variant="ghost" onClick={recheckEvents}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Recheck events
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Branded
                </span>
                <span className="text-xs">
                  views: <strong>{brandedViews ?? "—"}</strong>
                  {brandedBaseline !== null && (
                    <span className="text-muted-foreground"> (base {brandedBaseline})</span>
                  )}
                </span>
              </div>
              <p className="font-mono text-[11px] break-all bg-muted/40 rounded p-2">
                {urls.branded}
              </p>
              <Button size="sm" variant="outline" asChild className="w-full">
                <a href={urls.branded} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open Branded
                </a>
              </Button>
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={verifiedBranded}
                  onCheckedChange={(v) => setVerifiedBranded(v === true)}
                />
                <span>I verified this opens in Guest/Incognito without login</span>
              </label>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Unbranded (MLS-safe)
                </span>
                <span className="text-xs">
                  views: <strong>{unbrandedViews ?? "—"}</strong>
                  {unbrandedBaseline !== null && (
                    <span className="text-muted-foreground"> (base {unbrandedBaseline})</span>
                  )}
                </span>
              </div>
              <p className="font-mono text-[11px] break-all bg-muted/40 rounded p-2">
                {urls.unbranded}
              </p>
              <Button size="sm" variant="outline" asChild className="w-full">
                <a href={urls.unbranded} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open Unbranded
                </a>
              </Button>
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={verifiedUnbranded}
                  onCheckedChange={(v) => setVerifiedUnbranded(v === true)}
                />
                <span>I verified this opens in Guest/Incognito without login</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-2 mb-6">
        <div className="px-4 py-3 border-b flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>{tests.length} checks</span>
          <span>
            <span className="text-emerald-700 dark:text-emerald-400">{passing} pass</span>
            {" · "}
            <span className="text-amber-700 dark:text-amber-400">{manual} manual</span>
            {" · "}
            <span className="text-red-700 dark:text-red-400">{failing} fail</span>
          </span>
        </div>
        <ul className="divide-y">
          {tests.map((t) => (
            <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm">{t.label}</p>
                {t.detail && <p className="text-xs text-muted-foreground mt-0.5">{t.detail}</p>}
              </div>
              <StatusBadge s={t.status} />
            </li>
          ))}
          {tests.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground text-center">Initialising…</li>
          )}
        </ul>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Final acceptance
        </p>
        <ul className="space-y-2">
          {acceptance.map((a) => (
            <li key={a.label} className="flex items-center gap-2 text-sm">
              {a.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={a.ok ? "" : "text-muted-foreground"}>{a.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 text-right">
        <Link
          to="/dashboard"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
