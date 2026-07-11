import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Probe = { ok: boolean | null; detail: string };

async function anonFetch(path: string, init?: RequestInit) {
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
    return {
      ok: res.ok,
      detail: res.ok
        ? `HTTP ${res.status}`
        : `HTTP ${res.status} ${(await res.text()).slice(0, 120)}`,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "network" };
  }
}

function Row({ label, probe }: { label: string; probe: Probe }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{probe.detail}</p>
      </div>
      {probe.ok === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 mt-0.5" />
      ) : probe.ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
      )}
    </li>
  );
}

export function PublicAccessPanel({ slug }: { slug: string }) {
  const [listing, setListing] = useState<Probe>({ ok: null, detail: "checking…" });
  const [insert, setInsert] = useState<Probe>({ ok: null, detail: "checking…" });
  const [rpc, setRpc] = useState<Probe>({ ok: null, detail: "checking…" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      // 1. Anon SELECT on listings MUST be denied post-hardening.
      try {
        const res = await fetch(
          `${url}/rest/v1/listings?slug=eq.${encodeURIComponent(slug)}&select=id`,
          { headers: { apikey: key } },
        );
        const rows = res.ok ? ((await res.json()) as unknown[]) : [];
        if (!cancelled) {
          const denied = !res.ok || rows.length === 0;
          setListing({
            ok: denied,
            detail: denied
              ? `Denied (HTTP ${res.status}) — anon cannot read listings directly ✓`
              : `HTTP ${res.status} — anon still reads listings (fail)`,
          });
        }
      } catch (e) {
        if (!cancelled)
          setListing({ ok: true, detail: e instanceof Error ? e.message : "network denied" });
      }

      // 2. Direct anon INSERT into events MUST be denied.
      const ins = await anonFetch("events", {
        method: "POST",
        body: JSON.stringify({
          page_type: "unbranded",
          event_type: "page_view",
          user_agent: "public-access-panel",
          device_type: "desktop",
          visitor_hash: "anon-probe-" + crypto.randomUUID(),
        }),
      });
      if (!cancelled)
        setInsert({
          ok: !ins.ok,
          detail: !ins.ok
            ? `Denied — direct anon INSERT blocked ✓ (${ins.detail})`
            : `Unexpected success (${ins.detail}) — should be blocked`,
        });

      // 3. Sanctioned RPC MUST succeed for anon.
      const rpcRes = await anonFetch("rpc/record_public_event", {
        method: "POST",
        body: JSON.stringify({
          p_slug: slug,
          p_page_type: "unbranded",
          p_event_type: "page_view",
          p_referrer: "",
          p_utm_source: "",
          p_utm_campaign: "",
          p_user_agent: "public-access-panel",
          p_device_type: "desktop",
          p_visitor_hash: "anon-probe-" + crypto.randomUUID(),
        }),
      });
      if (!cancelled) setRpc(rpcRes);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const anyFail = [listing, insert, rpc].some((p) => p.ok === false);

  return (
    <Card className="p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Public access status
          </p>
          <h3 className="font-display text-xl mt-1">Anonymous probe</h3>
        </div>
      </div>
      <ul className="text-sm">
        <Row label="Anon SELECT on listings is denied" probe={listing} />
        <Row label="Anon direct INSERT into events is denied" probe={insert} />
        <Row label="Anon can call record_public_event RPC" probe={rpc} />
      </ul>
      {anyFail && (
        <p className="text-xs text-red-700 dark:text-red-400 mt-3">
          Public access contract violated. Investigate before MLS/Zillow usage.
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        Final acceptance test: open the Unbranded MLS URL in Chrome Guest or Incognito — the tour
        must render without any sign-in prompt.
      </p>
    </Card>
  );
}
