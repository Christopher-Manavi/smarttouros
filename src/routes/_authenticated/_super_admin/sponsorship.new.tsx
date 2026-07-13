import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCampaign } from "@/lib/sponsorship/campaigns.functions";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_super_admin/sponsorship/new")({
  component: NewCampaign,
});

function NewCampaign() {
  const create = useServerFn(createCampaign);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zips, setZips] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    setSaving(true);
    try {
      const zip_codes = zips
        .split(/[,\s;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await create({
        data: {
          campaign_name: name.trim(),
          market_city: city.trim() || null,
          market_state: state.trim() || null,
          zip_codes,
        },
      });
      toast.success("Campaign created");
      navigate({ to: "/sponsorship/$campaignId", params: { campaignId: res.id }, search: { tab: "agents" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-luxe py-10 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/sponsorship">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>
      <h1 className="font-display text-3xl mb-6">New Sponsorship Campaign</h1>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Denver Metro Q3 pilot"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Market city</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Market state</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={40}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zips">ZIP codes (comma or space-separated)</Label>
            <Textarea
              id="zips"
              value={zips}
              onChange={(e) => setZips(e.target.value)}
              rows={3}
              placeholder="80202, 80203, 80204"
            />
            <p className="text-xs text-muted-foreground">
              5-digit ZIPs only. Duplicates and malformed values are stripped server-side.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/sponsorship" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create campaign"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
