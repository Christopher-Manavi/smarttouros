import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Eye, Users, Activity, Youtube } from "lucide-react";
import { isYouTubeUrl } from "@/components/media-embed";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="font-display text-4xl mt-3">{value}</div>
    </Card>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [ytUrl, setYtUrl] = useState("");

  function startSmartTour() {
    const raw = ytUrl.trim();
    if (!raw) {
      toast.error("Paste a YouTube or Shorts URL first");
      return;
    }
    if (!isYouTubeUrl(raw)) {
      toast.error("That doesn't look like a YouTube URL");
      return;
    }
    navigate({ to: "/create-listing", search: { yt: raw } });
  }

  const { data, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [listings, events] = await Promise.all([
        supabase
          .from("listings")
          .select("id, address, city, state, status, slug, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, listing_id, event_type, visitor_hash, created_at, page_type")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      return { listings: listings.data ?? [], events: events.data ?? [] };
    },
  });

  const listings = data?.listings ?? [];
  const events = data?.events ?? [];
  const pageViews = events.filter((e) => e.event_type === "page_view");
  const unique = new Set(pageViews.map((e) => e.visitor_hash).filter(Boolean)).size;
  const topMap = new Map<string, number>();
  pageViews.forEach((e) => topMap.set(e.listing_id, (topMap.get(e.listing_id) ?? 0) + 1));
  const top = [...topMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, v]) => ({ listing: listings.find((l) => l.id === id), views: v }))
    .filter((r) => r.listing);

  return (
    <div className="container-luxe py-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
          <h1 className="font-display text-4xl mt-2">Dashboard</h1>
        </div>
      </div>


      <Card className="p-6 mb-6 border-foreground/20 bg-muted/30">
        <div className="flex items-start gap-3 mb-3">
          <Youtube className="h-6 w-6 mt-0.5" />
          <div>
            <h2 className="font-display text-2xl">
              Turn a YouTube video into a smart MLS-safe tour
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paste a YouTube or Shorts link, then finish the listing details in the normal create
              flow.
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Instead of pasting a raw YouTube link into MLS, paste your MLS-safe SmartTourOS link.
              Same video, better presentation, tracking, and seller reporting.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="Paste YouTube or Shorts URL"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                startSmartTour();
              }
            }}
          />
          <Button onClick={startSmartTour}>Start smart tour</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total listings" value={listings.length} />
        <StatCard
          icon={Activity}
          label="Active listings"
          value={listings.filter((l) => l.status === "active").length}
        />
        <StatCard icon={Eye} label="Total page views" value={pageViews.length} />
        <StatCard icon={Users} label="Unique visitors" value={unique} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h2 className="font-display text-2xl mb-4">Top listings</h2>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views yet.</p>
          ) : (
            <ul className="divide-y">
              {top.map((r) => (
                <li key={r.listing!.id} className="py-3 flex justify-between items-center gap-3">
                  <Link
                    to="/listings/$id/report"
                    params={{ id: r.listing!.id }}
                    className="text-sm hover:underline flex-1 truncate"
                  >
                    {r.listing!.address}
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.listing!.city}, {r.listing!.state}
                    </span>
                  </Link>
                  <span className="font-mono text-sm text-muted-foreground">{r.views}</span>
                  <Link to="/listings/$id/report" params={{ id: r.listing!.id }}>
                    <Button size="sm" variant="outline">
                      View Report
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-2xl mb-4">Recent activity</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {events.slice(0, 8).map((e) => {
                const l = listings.find((x) => x.id === e.listing_id);
                return (
                  <li key={e.id} className="py-2.5 flex justify-between text-sm">
                    <span>
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mr-2">
                        {e.event_type}
                      </span>
                      {l?.address ?? "Unknown listing"}
                      <span className="text-muted-foreground"> · {e.page_type}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
