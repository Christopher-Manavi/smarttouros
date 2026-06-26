import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowLeft, Download, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { brandedTourUrl, unbrandedTourUrl } from "@/lib/public-url";

export const Route = createFileRoute("/_authenticated/listings/$id/report")({
  component: ListingReport,
});

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function detectDevice(ua: string | null | undefined): string {
  if (!ua) return "Unknown";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobile|iPhone|Android/i.test(ua)) return "Mobile";
  return "Desktop";
}

function uaSummary(ua: string | null | undefined): string {
  if (!ua) return "—";
  const browser = /Chrome\/(\d+)/.exec(ua)?.[0] ?? /Firefox\/(\d+)/.exec(ua)?.[0] ?? /Safari\/(\d+)/.exec(ua)?.[0] ?? "Browser";
  const os = /Windows NT/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "OS";
  return `${browser} · ${os}`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
    </Card>
  );
}

function ListingReport() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["listing-report", id],
    queryFn: async () => {
      const [{ data: listing }, { data: events }, { data: tracking }] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("events").select("*").eq("listing_id", id).order("created_at", { ascending: false }),
        supabase.from("tracking_settings").select("*").maybeSingle(),
      ]);
      return { listing, events: events ?? [], tracking };
    },
  });

  if (isLoading) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  if (!data?.listing) return <div className="container-luxe py-10 text-muted-foreground">Listing not found.</div>;

  const { listing, events, tracking } = data;
  const pageViews = events.filter((e) => e.event_type === "page_view");
  const uniqueHashes = new Set(pageViews.map((e) => e.visitor_hash).filter(Boolean));
  const unique = uniqueHashes.size;
  const branded = pageViews.filter((e) => e.page_type === "branded").length;
  const unbranded = pageViews.filter((e) => e.page_type === "unbranded").length;

  const visitCounts = new Map<string, number>();
  pageViews.forEach((e) => { if (e.visitor_hash) visitCounts.set(e.visitor_hash, (visitCounts.get(e.visitor_hash) ?? 0) + 1); });
  const repeat = [...visitCounts.values()].filter((n) => n > 1).length;
  const lastView = pageViews[0]?.created_at;

  const brandedUrl = brandedTourUrl(listing.slug);
  const unbrandedUrl = unbrandedTourUrl(listing.slug);

  const trackingBranded = !!tracking?.enable_branded_tracking;
  const trackingUnbranded = !!tracking?.enable_unbranded_tracking;
  const untitledInstalled = !!tracking?.untitled_script || !!(tracking?.custom_header_script && /untitled/i.test(tracking.custom_header_script));

  function exportCsv() {
    const headers = ["timestamp", "page_type", "event_type", "referrer", "utm_source", "device", "user_agent"];
    const rows = events.map((e) => [
      new Date(e.created_at).toISOString(),
      e.page_type ?? "",
      e.event_type ?? "",
      e.referrer ?? "",
      e.utm_source ?? "",
      detectDevice(e.user_agent),
      (e.user_agent ?? "").replace(/,/g, " "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `listing-${listing.slug}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container-luxe py-10">
      <Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3 w-3" /> All listings
      </Link>

      {/* Header */}
      <Card className="p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Listing Performance Report</p>
            <h1 className="font-display text-4xl mt-2">{listing.address}</h1>
            <p className="text-muted-foreground mt-1">{listing.city}, {listing.state} {listing.zip}</p>
            <div className="flex items-center gap-3 mt-4">
              {listing.price && <span className="font-mono text-lg">${Number(listing.price).toLocaleString()}</span>}
              <Badge variant={listing.status === "active" ? "default" : "secondary"} className="capitalize">{listing.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-3 w-3 mr-1" /> Export CSV</Button>
            <Button variant="outline" size="sm" disabled><FileText className="h-3 w-3 mr-1" /> Seller Report PDF (coming soon)</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-8 pt-6 border-t">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Branded tour URL</div>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted/40 px-3 py-2 rounded truncate">{brandedUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copy(brandedUrl, "Branded URL")}><Copy className="h-3 w-3" /></Button>
              <a href={brandedUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3 w-3" /></Button></a>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Unbranded MLS-safe URL</div>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted/40 px-3 py-2 rounded truncate">{unbrandedUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copy(unbrandedUrl, "Unbranded URL")}><Copy className="h-3 w-3" /></Button>
              <a href={unbrandedUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3 w-3" /></Button></a>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance summary */}
      <h2 className="font-display text-2xl mb-3">Performance summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total views" value={pageViews.length} />
        <StatCard label="Unique visitors" value={unique} />
        <StatCard label="Branded views" value={branded} />
        <StatCard label="MLS views" value={unbranded} />
        <StatCard label="Repeat visitors" value={repeat} />
        <StatCard label="Most recent visit" value={lastView ? new Date(lastView).toLocaleDateString() : "—"} />
      </div>

      {/* Seller-friendly summary */}
      <Card className="p-6 mb-8 bg-muted/20">
        <h2 className="font-display text-xl mb-3">Summary</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your listing tour is live and receiving traffic. The unbranded MLS-safe page is being used
          for portal and MLS traffic, while the branded page can be used for email, social, QR codes,
          and direct sharing. Use the activity breakdown below to see where engagement is coming from
          and how visitors are interacting with the tour.
        </p>
      </Card>

      {/* Tracking status */}
      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl mb-4">Tracking status</h2>
        <ul className="grid md:grid-cols-2 gap-3 text-sm">
          <li className="flex justify-between border-b pb-2"><span>Tracking enabled on branded pages</span><Badge variant={trackingBranded ? "default" : "secondary"}>{trackingBranded ? "Yes" : "No"}</Badge></li>
          <li className="flex justify-between border-b pb-2"><span>Tracking enabled on unbranded pages</span><Badge variant={trackingUnbranded ? "default" : "secondary"}>{trackingUnbranded ? "Yes" : "No"}</Badge></li>
          <li className="flex justify-between border-b pb-2"><span>Audience activation tag installed</span><Badge variant={untitledInstalled ? "default" : "secondary"}>{untitledInstalled ? "Yes" : "No"}</Badge></li>
          <li className="flex justify-between border-b pb-2"><span>Last page view recorded</span><span className="text-muted-foreground">{lastView ? new Date(lastView).toLocaleString() : "Never"}</span></li>
        </ul>
      </Card>

      {/* Activity breakdown */}
      <Card className="p-6">
        <h2 className="font-display text-xl mb-4">Visitor activity</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Timestamp</th>
                  <th className="text-left py-2 px-2 font-medium">Page</th>
                  <th className="text-left py-2 px-2 font-medium">Event</th>
                  <th className="text-left py-2 px-2 font-medium">Referrer</th>
                  <th className="text-left py-2 px-2 font-medium">UTM source</th>
                  <th className="text-left py-2 px-2 font-medium">Device</th>
                  <th className="text-left py-2 px-2 font-medium">Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.slice(0, 200).map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2 capitalize">{e.page_type ?? "—"}</td>
                    <td className="py-2 px-2 font-mono text-xs">{e.event_type}</td>
                    <td className="py-2 px-2 text-xs truncate max-w-[180px]">{e.referrer || "Direct"}</td>
                    <td className="py-2 px-2 text-xs">{e.utm_source || "—"}</td>
                    <td className="py-2 px-2 text-xs">{detectDevice(e.user_agent)}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{uaSummary(e.user_agent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
