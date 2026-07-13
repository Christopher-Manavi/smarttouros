import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listCampaigns } from "@/lib/sponsorship/campaigns.functions";
import { Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_super_admin/sponsorship/")({
  component: SponsorshipIndex,
});

type Campaign = Awaited<ReturnType<typeof listCampaigns>>[number];

function SponsorshipIndex() {
  const list = useServerFn(listCampaigns);
  const navigate = useNavigate();
  const [rows, setRows] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    list({})
      .then((r) => setRows(r as Campaign[]))
      .catch((e: Error) => setError(e.message));
  }, [list]);

  return (
    <div className="container-luxe py-10 max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Internal · super_admin
          </p>
          <h1 className="font-display text-4xl mt-2">Sponsorship Engine</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Match real estate agents with lender sponsors. Phase 1 previews invitations without
            sending; no external integrations are wired.
          </p>
        </div>
        <Button asChild>
          <Link to="/sponsorship/new">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5 text-sm">{error}</Card>
      )}

      {rows === null && !error && (
        <Card className="p-6 text-sm text-muted-foreground">Loading campaigns…</Card>
      )}

      {rows && rows.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a market-scoped campaign to import agents and lenders.
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: "/sponsorship/new" })}>
            Create first campaign
          </Button>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              to="/sponsorship/$campaignId"
              params={{ campaignId: c.id }}
              className="block"
            >
              <Card className="p-4 hover:bg-muted/30 transition">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.campaign_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[c.market_city, c.market_state].filter(Boolean).join(", ") ||
                        "No market set"}
                      {c.zip_codes && c.zip_codes.length > 0
                        ? ` · ${c.zip_codes.length} ZIPs`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                    {c.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
