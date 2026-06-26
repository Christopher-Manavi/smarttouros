import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { brandedTourUrl, unbrandedTourUrl } from "@/lib/public-url";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/listings/$id/analytics")({
  component: ListingAnalytics,
});

function ListingAnalytics() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["listing-analytics", id],
    queryFn: async () => {
      const [{ data: listing }, { data: events }] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("events").select("*").eq("listing_id", id).order("created_at", { ascending: false }),
      ]);
      return { listing, events: events ?? [] };
    },
  });

  if (!data?.listing) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  const { listing, events } = data;
  const pageViews = events.filter((e) => e.event_type === "page_view");
  const unique = new Set(pageViews.map((e) => e.visitor_hash).filter(Boolean)).size;
  const branded = pageViews.filter((e) => e.page_type === "branded").length;
  const unbranded = pageViews.filter((e) => e.page_type === "unbranded").length;
  const mediaClicks = events.filter((e) => ["media_click", "video_play"].includes(e.event_type)).length;
  const ctaClicks = events.filter((e) => e.event_type === "cta_click").length;

  // Daily series last 14 days
  const days: { date: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key.slice(5), views: 0 });
    const day = pageViews.filter((e) => e.created_at.slice(0, 10) === key).length;
    days[days.length - 1].views = day;
  }

  const referrers = new Map<string, number>();
  events.forEach((e) => { if (e.referrer) referrers.set(e.referrer, (referrers.get(e.referrer) ?? 0) + 1); });
  const topRefs = [...referrers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const brandedUrl = brandedTourUrl(listing.slug);
  const unbrandedUrl = unbrandedTourUrl(listing.slug);

  return (
    <div className="container-luxe py-10">
      <Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-3 w-3" /> All listings
      </Link>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Analytics</p>
          <h1 className="font-display text-4xl mt-2">{listing.address}</h1>
          <p className="text-muted-foreground">{listing.city}, {listing.state}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(brandedUrl); toast.success("Branded URL copied"); }}>
            <Copy className="h-3 w-3 mr-1" /> Branded
          </Button>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(unbrandedUrl); toast.success("Unbranded URL copied"); }}>
            <Copy className="h-3 w-3 mr-1" /> MLS-safe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          ["Page views", pageViews.length], ["Unique", unique],
          ["Branded", branded], ["Unbranded", unbranded], ["Media plays", mediaClicks],
        ].map(([l, v]) => (
          <Card key={l} className="p-5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
            <div className="font-display text-3xl mt-2">{v}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-display text-xl mb-4">Page views — last 14 days</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <RLineChart data={days}>
              <CartesianGrid stroke="hsl(0 0% 90%)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="currentColor" fontSize={11} />
              <YAxis stroke="currentColor" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="currentColor" strokeWidth={2} dot={false} />
            </RLineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-display text-xl mb-4">Top referrers</h2>
          {topRefs.length === 0 ? <p className="text-sm text-muted-foreground">No referrer data yet.</p> :
            <ul className="divide-y">
              {topRefs.map(([r, n]) => (
                <li key={r} className="py-2 flex justify-between text-sm">
                  <span className="truncate max-w-[70%]">{r}</span><span className="font-mono">{n}</span>
                </li>
              ))}
            </ul>}
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            CTA clicks: <span className="font-mono text-foreground">{ctaClicks}</span>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-xl mb-4">Recent events</h2>
          <ul className="divide-y text-sm max-h-96 overflow-y-auto">
            {events.slice(0, 30).map((e) => (
              <li key={e.id} className="py-2 flex justify-between gap-3">
                <span><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mr-2">{e.event_type}</span>{e.page_type}</span>
                <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
