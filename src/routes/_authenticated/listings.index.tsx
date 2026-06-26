import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Pencil, BarChart3, Plus, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { brandedTourUrl, unbrandedTourUrl } from "@/lib/public-url";

export const Route = createFileRoute("/_authenticated/listings/")({
  component: ListingsIndex,
});

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function ListingsIndex() {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, address, city, state, price, status, slug, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: viewMap = {} } = useQuery({
    queryKey: ["listings-views"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("listing_id").eq("event_type", "page_view");
      const map: Record<string, number> = {};
      (data ?? []).forEach((e) => (map[e.listing_id] = (map[e.listing_id] ?? 0) + 1));
      return map;
    },
  });

  // Canonical public base URL (never window.location.origin — that may be the editor preview).

  return (
    <div className="container-luxe py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Properties</p>
          <h1 className="font-display text-4xl mt-2">Listings</h1>
        </div>
        <Link to="/create-listing"><Button><Plus className="h-4 w-4 mr-1" /> New listing</Button></Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Address</th>
                <th className="text-left py-3 px-4 font-medium">Location</th>
                <th className="text-left py-3 px-4 font-medium">Price</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">URLs</th>
                <th className="text-right py-3 px-4 font-medium">Views</th>
                <th className="text-right py-3 px-4 font-medium">Created</th>
                <th className="px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && listings.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No listings yet.</p>
                  <Link to="/create-listing"><Button size="sm">Create your first listing</Button></Link>
                </td></tr>
              )}
              {listings.map((l) => {
                const branded = brandedTourUrl(l.slug);
                const unbranded = unbrandedTourUrl(l.slug);
                return (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{l.address}</td>
                    <td className="py-3 px-4 text-muted-foreground">{l.city}, {l.state}</td>
                    <td className="py-3 px-4 font-mono">{l.price ? `$${Number(l.price).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={l.status === "active" ? "default" : "secondary"} className="capitalize">{l.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => copy(branded, "Branded URL")}>
                          <Copy className="h-3 w-3 mr-1" /> Branded
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copy(unbranded, "Unbranded URL")}>
                          <Copy className="h-3 w-3 mr-1" /> MLS
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{viewMap[l.id] ?? 0}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1 justify-end">
                        <a href={branded} target="_blank" rel="noreferrer">
                          <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                        <Link to="/listings/$id/analytics" params={{ id: l.id }}>
                          <Button size="icon" variant="ghost"><BarChart3 className="h-4 w-4" /></Button>
                        </Link>
                        <Link to="/listings/$id" params={{ id: l.id }}>
                          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
