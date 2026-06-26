import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tracking")({
  component: Tracking,
});

function Tracking() {
  const { companyId } = useAuth();
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("tracking_settings").select("*").eq("company_id", companyId).maybeSingle()
      .then(({ data }) => setS(data ?? { company_id: companyId }));
  }, [companyId]);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("tracking_settings").upsert(s, { onConflict: "company_id" });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Tracking settings saved");
  }

  if (!s) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  const set = (k: string, v: any) => setS({ ...s, [k]: v });

  return (
    <div className="container-luxe py-10 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl mt-2">Tracking</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Paste tracking scripts and identity tags. They'll inject only on public listing pages
          you've enabled below.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        {[
          ["untitled_script", "Untitled ID Tag script"],
          ["ga_script", "Google Analytics / GTM"],
          ["meta_pixel_script", "Meta Pixel"],
          ["custom_header_script", "Custom header script"],
          ["custom_footer_script", "Custom footer script"],
        ].map(([k, label]) => (
          <div key={k}>
            <Label>{label}</Label>
            <Textarea rows={3} className="font-mono text-xs" value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
      </Card>

      <Card className="p-6 mt-6 space-y-4">
        <h2 className="font-display text-xl mb-2">Where tracking fires</h2>
        {[
          ["enable_branded_tracking", "Enable tracking on branded pages"],
          ["enable_unbranded_tracking", "Enable tracking on unbranded pages"],
          ["enable_analytics_dashboard", "Enable analytics dashboard"],
          ["enable_privacy_banner", "Show privacy banner"],
        ].map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm">{label}</span>
            <Switch checked={!!s[k]} onCheckedChange={(c) => set(k, c)} />
          </div>
        ))}
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </div>
    </div>
  );
}
