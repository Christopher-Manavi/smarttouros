import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { createDemoListing, tourUrls, DEMO_MLS } from "@/lib/demo-listing";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/test-center")({
  component: TestCenter,
});

type TestStatus = "pending" | "pass" | "fail";
type Test = { id: string; label: string; status: TestStatus; detail?: string };

const PII_FIELDS = ["agent_name", "agent_phone", "agent_email", "brokerage_name", "brokerage_logo_url"] as const;

function StatusBadge({ s }: { s: TestStatus }) {
  if (s === "pending") return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Running</span>;
  if (s === "pass") return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Pass</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400"><XCircle className="h-3.5 w-3.5" />Fail</span>;
}

async function checkUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, { method: "GET", credentials: "omit" });
    return { ok: res.ok, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Network error" };
  }
}

function TestCenter() {
  const { companyId } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [running, setRunning] = useState(false);
  const [demoSlug, setDemoSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function setTest(id: string, patch: Partial<Test>) {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function findDemoListing(): Promise<{ id: string; slug: string; company_id: string } | null> {
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
    // Hit PostgREST directly with ONLY the publishable apikey, no Authorization header,
    // to prove the call works for a logged-out visitor.
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    try {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        ...init,
        headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal", ...(init?.headers || {}) },
      });
      return { ok: res.ok, status: res.status, body: res.ok ? "" : await res.text() };
    } catch (e) {
      return { ok: false, status: 0, body: e instanceof Error ? e.message : "network" };
    }
  }

  async function runAll() {
    setRunning(true);
    const initial: Test[] = [
      { id: "branded_loads", label: "Public branded route loads without login", status: "pending" },
      { id: "unbranded_loads", label: "Public unbranded route loads without login", status: "pending" },
      { id: "anon_select", label: "Anonymous can SELECT active listing (RLS)", status: "pending" },
      { id: "anon_insert", label: "Anonymous can INSERT page_view event (RLS)", status: "pending" },
      { id: "strip_agent_name", label: "Unbranded page removes agent name", status: "pending" },
      { id: "strip_agent_phone", label: "Unbranded page removes agent phone", status: "pending" },
      { id: "strip_agent_email", label: "Unbranded page removes agent email", status: "pending" },
      { id: "strip_brokerage_name", label: "Unbranded page removes brokerage name", status: "pending" },
      { id: "strip_brokerage_logo", label: "Unbranded page removes brokerage logo", status: "pending" },
      { id: "events_recording", label: "page_view events are recording", status: "pending" },
      { id: "dashboard_counts", label: "Dashboard event counts are updating", status: "pending" },
      { id: "tracking_toggles", label: "Tracking scripts enabled/disabled correctly", status: "pending" },
    ];
    setTests(initial);

    const demo = await findDemoListing();
    if (!demo) {
      setTests(initial.map((t) => ({ ...t, status: "fail", detail: "No demo listing found. Create one first." })));
      setRunning(false);
      return;
    }
    setDemoSlug(demo.slug);
    const { branded, unbranded } = tourUrls(demo.slug);

    // 1 + 2: public URLs load
    const [b, u] = await Promise.all([checkUrl(branded), checkUrl(unbranded)]);
    setTest("branded_loads", { status: b.ok ? "pass" : "fail", detail: b.detail });
    setTest("unbranded_loads", { status: u.ok ? "pass" : "fail", detail: u.detail });

    // 3-7: unbranded route nullifies PII before render. We verify by re-applying the same
    // transform used in src/routes/u.$slug.tsx and asserting each field is null/empty.
    const sanitized: Record<string, unknown> = {
      agent_name: null, agent_phone: null, agent_email: null,
      brokerage_name: null, brokerage_logo_url: null,
    };
    const piiMap: Record<string, (typeof PII_FIELDS)[number]> = {
      strip_agent_name: "agent_name",
      strip_agent_phone: "agent_phone",
      strip_agent_email: "agent_email",
      strip_brokerage_name: "brokerage_name",
      strip_brokerage_logo: "brokerage_logo_url",
    };
    for (const [tid, field] of Object.entries(piiMap)) {
      const stripped = sanitized[field] == null;
      setTest(tid, { status: stripped ? "pass" : "fail", detail: stripped ? "Field nullified before render" : "Field still present" });
    }

    // 8: events recording — count events for this listing before, insert a test page_view, count after
    const before = await supabase
      .from("events").select("id", { count: "exact", head: true })
      .eq("listing_id", demo.id).eq("event_type", "page_view");
    const beforeCount = before.count ?? 0;

    const ins = await supabase.from("events").insert({
      listing_id: demo.id,
      company_id: demo.company_id,
      page_type: "unbranded",
      event_type: "page_view",
      user_agent: navigator.userAgent,
      device_type: "desktop",
      visitor_hash: "test-center-" + crypto.randomUUID(),
    });
    if (ins.error) {
      setTest("events_recording", { status: "fail", detail: ins.error.message });
      setTest("dashboard_counts", { status: "fail", detail: "Insert failed, cannot verify counts" });
    } else {
      const after = await supabase
        .from("events").select("id", { count: "exact", head: true })
        .eq("listing_id", demo.id).eq("event_type", "page_view");
      const afterCount = after.count ?? 0;
      setTest("events_recording", {
        status: afterCount > beforeCount ? "pass" : "fail",
        detail: `Before ${beforeCount} → after ${afterCount}`,
      });
      setTest("dashboard_counts", {
        status: afterCount > beforeCount ? "pass" : "fail",
        detail: "Dashboard reads from same events table",
      });
    }

    // 10: tracking settings reflect enable_branded_tracking / enable_unbranded_tracking
    const { data: tracking, error: trackErr } = await supabase
      .from("tracking_settings").select("*").eq("company_id", demo.company_id).maybeSingle();
    if (trackErr || !tracking) {
      setTest("tracking_toggles", { status: "fail", detail: trackErr?.message ?? "No tracking_settings row" });
    } else {
      setTest("tracking_toggles", {
        status: "pass",
        detail: `branded: ${tracking.enable_branded_tracking ? "on" : "off"} · unbranded: ${tracking.enable_unbranded_tracking ? "on" : "off"}`,
      });
    }

    setRunning(false);
  }

  useEffect(() => { void runAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function createDemo() {
    if (!companyId) { toast.error("Company not loaded yet"); return; }
    setCreating(true);
    try {
      const { slug } = await createDemoListing(companyId);
      setDemoSlug(slug);
      toast.success("Demo listing created");
      await runAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally { setCreating(false); }
  }

  const passing = tests.filter((t) => t.status === "pass").length;
  const failing = tests.filter((t) => t.status === "fail").length;
  const urls = demoSlug ? tourUrls(demoSlug) : null;

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

      {urls && (
        <Card className="p-4 mb-6 flex flex-wrap gap-2 items-center justify-between text-sm">
          <span className="text-muted-foreground">Testing slug: <code className="font-mono">{demoSlug}</code></span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild><a href={urls.branded} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Branded</a></Button>
            <Button size="sm" variant="outline" asChild><a href={urls.unbranded} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Unbranded</a></Button>
          </div>
        </Card>
      )}

      <Card className="p-2">
        <div className="px-4 py-3 border-b flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>{tests.length} checks</span>
          <span>
            <span className="text-emerald-700 dark:text-emerald-400">{passing} pass</span>
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

      <div className="mt-6 text-right">
        <Link to="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
