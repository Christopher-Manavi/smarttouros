import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company")({
  component: Company,
});

function Company() {
  const { companyId } = useAuth();
  const [c, setC] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("companies").select("*").eq("id", companyId).maybeSingle()
      .then(({ data }) => setC(data));
  }, [companyId]);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("companies").update({
      name: c.name, brand_color: c.brand_color, phone: c.phone, email: c.email, logo_url: c.logo_url,
    }).eq("id", c.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Company saved");
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !c) return;
    const path = `${c.id}/${crypto.randomUUID()}.${f.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, f);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    setC({ ...c, logo_url: data.publicUrl });
  }

  if (!c) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  const set = (k: string, v: any) => setC({ ...c, [k]: v });

  return (
    <div className="container-luxe py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl mt-2">Company</h1>
      </div>

      <Card className="p-6 space-y-4">
        <div><Label>Company name</Label><Input value={c.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Contact email</Label><Input value={c.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label>Contact phone</Label><Input value={c.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
        </div>
        <div>
          <Label>Brand color</Label>
          <div className="flex gap-2 items-center">
            <Input type="color" value={c.brand_color ?? "#0a0a0a"} onChange={(e) => set("brand_color", e.target.value)} className="w-20 h-10 p-1" />
            <Input value={c.brand_color ?? ""} onChange={(e) => set("brand_color", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Logo</Label>
          {c.logo_url && <img src={c.logo_url} alt="logo" className="h-16 mb-2 object-contain" />}
          <Input type="file" accept="image/*" onChange={uploadLogo} />
        </div>
        <div className="flex items-center justify-between border rounded-md p-4 bg-muted/30">
          <div>
            <Label>Custom domain</Label>
            <p className="text-xs text-muted-foreground">Serve tour pages on your own domain.</p>
          </div>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
