import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DEFAULT_PRIVACY_URL, DEFAULT_TERMS_URL, DEFAULT_PRIVACY_NOTICE_TEXT } from "@/lib/compliance";

export const Route = createFileRoute("/_authenticated/privacy-settings")({
  component: Privacy,
});

const DEFAULT_ROW = {
  privacy_policy_url: "",
  terms_url: "",
  privacy_notice_text: "",
  show_privacy_notice: true,
  direct_mail_enabled: false,
  crm_export_enabled: false,
};

function Privacy() {
  const { companyId } = useAuth();
  const [p, setP] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("privacy_settings").select("*").eq("company_id", companyId).maybeSingle()
      .then(({ data }) => setP(data ?? { ...DEFAULT_ROW, company_id: companyId }));
  }, [companyId]);


  async function save() {
    setBusy(true);
    const { error } = await supabase.from("privacy_settings").upsert(p, { onConflict: "company_id" });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  if (!p) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  const set = (k: string, v: any) => setP({ ...p, [k]: v });

  return (
    <div className="container-luxe py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl mt-2">Privacy & compliance</h1>
      </div>

      <Card className="p-6 space-y-5">
        <div><Label>Privacy policy URL</Label><Input value={p.privacy_policy_url ?? ""} onChange={(e) => set("privacy_policy_url", e.target.value)} /></div>
        <div><Label>Terms URL</Label><Input value={p.terms_url ?? ""} onChange={(e) => set("terms_url", e.target.value)} /></div>
        <div>
          <Label>Privacy notice text</Label>
          <Textarea rows={3} value={p.privacy_notice_text ?? ""} onChange={(e) => set("privacy_notice_text", e.target.value)} />
        </div>
      <Card className="p-6 space-y-5">
        <p className="text-xs text-muted-foreground">
          These fields are optional workspace-level overrides. If left blank, your public listing pages
          will use the default SmartTourOS compliance pages.
        </p>
        <div>
          <Label>Privacy policy URL</Label>
          <Input value={p.privacy_policy_url ?? ""} onChange={(e) => set("privacy_policy_url", e.target.value)} placeholder={DEFAULT_PRIVACY_URL} />
          <p className="text-xs text-muted-foreground mt-1">Default: <code className="font-mono">{DEFAULT_PRIVACY_URL}</code></p>
        </div>
        <div>
          <Label>Terms URL</Label>
          <Input value={p.terms_url ?? ""} onChange={(e) => set("terms_url", e.target.value)} placeholder={DEFAULT_TERMS_URL} />
          <p className="text-xs text-muted-foreground mt-1">Default: <code className="font-mono">{DEFAULT_TERMS_URL}</code></p>
        </div>
        <div>
          <Label>Privacy notice text</Label>
          <Textarea rows={3} value={p.privacy_notice_text ?? ""} onChange={(e) => set("privacy_notice_text", e.target.value)} placeholder={DEFAULT_PRIVACY_NOTICE_TEXT} />
          <p className="text-xs text-muted-foreground mt-1">If blank, the default notice is shown.</p>
        </div>
        {[
          ["show_privacy_notice", "Show privacy notice on listing pages"],
          ["direct_mail_enabled", "Direct mail activation enabled"],
          ["crm_export_enabled", "CRM export enabled"],
        ].map(([k, label]) => (
          <div key={k} className="flex items-center justify-between border-t pt-4">
            <span className="text-sm">{label}</span>
            <Switch checked={!!p[k]} onCheckedChange={(c) => set(k, c)} />
          </div>
        ))}
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
