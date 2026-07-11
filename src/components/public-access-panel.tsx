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
  const [active, setActive] = useState<Probe>({ ok: null, detail: "checking…" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Anonymous SELECT of the listing by slug (active only).
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      try {
        const res = await fetch(
          `${url}/rest/v1/listings?slug=eq.${encodeURIComponent(slug)}&select=id,status,company_id`,
          { headers: { apikey: key } },
        );
        const rows = (await res.json()) as Array<{
          id: string;
          status: string;
          company_id: string;
        }>;
        if (cancelled) return;
        const row = rows?.[0];
        if (!res.ok || !row) {
          setListing({ ok: false, detail: `HTTP ${res.status} — listing not visible to anon` });
          setActive({ ok: false, detail: "Cannot verify — listing not readable" });
          setInsert({ ok: false, detail: "Skipped — no listing context" });
          return;
        }
        setListing({ ok: true, detail: `HTTP ${res.status} — listing readable as anon` });
        setActive({
          ok: row.status === "active",
          detail: `status = ${row.status}`,
        });
        // Try an anonymous insert with the publishable key only.
        const ins = await anonFetch("events", {
          method: "POST",
          body: JSON.stringify({
            listing_id: row.id,
            company_id: row.company_id,
            page_type: "unbranded",
            event_type: "page_view",
            user_agent: "public-access-panel",
            device_type: "desktop",
            visitor_hash: "anon-probe-" + crypto.randomUUID(),
          }),
        });
        if (!cancelled) setInsert(ins);
      } catch (e) {
        if (cancelled) return;
        const detail = e instanceof Error ? e.message : "network error";
        setListing({ ok: false, detail });
        setActive({ ok: false, detail });
        setInsert({ ok: false, detail });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const anyFail = [listing, insert, active].some((p) => p.ok === false);

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
        <Row label="Active status" probe={active} />
        <Row label="Anonymous SELECT on listing (RLS + grants)" probe={listing} />
        <Row label="Anonymous INSERT into events (RLS + grants)" probe={insert} />
      </ul>
      {anyFail && (
        <p className="text-xs text-red-700 dark:text-red-400 mt-3">
          Public route is protected. This must be fixed before MLS/Zillow usage.
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        Final acceptance test: open the Unbranded MLS URL in Chrome Guest or Incognito — the tour
        must render without any sign-in prompt.
      </p>
    </Card>
  );
}
