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
import {
  getPublicBaseUrl,
  setPublicBaseUrl,
  DEFAULT_PUBLIC_BASE_URL,
  isPreviewUrl,
} from "@/lib/public-url";
import { useStorageSignedUrl } from "@/lib/storage-preview";


export const Route = createFileRoute("/_authenticated/company")({
  component: Company,
});

function Company() {
  const { companyId } = useAuth();
  const [c, setC] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [publicBase, setPublicBase] = useState(() => getPublicBaseUrl());

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle()
      .then(({ data }) => setC(data));
  }, [companyId]);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: c.name,
        brand_color: c.brand_color,
        phone: c.phone,
        email: c.email,
        logo_storage_path: c.logo_storage_path,
      })
      .eq("id", c.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Company saved");
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !c) return;
    const ext = (f.name.split(".").pop() ?? "bin").toLowerCase();
    // Storage policy requires the first folder segment to equal the caller's
    // own company_id.
    const path = `${c.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("company-logos")
      .upload(path, f, { contentType: f.type, upsert: false });
    if (error) return toast.error(error.message);
    setC({ ...c, logo_storage_path: path });
    toast.success("Logo uploaded");
  }


  const logoPreview = useStorageSignedUrl("company-logos", c?.logo_storage_path ?? null);
  if (!c) return <div className="container-luxe py-10 text-muted-foreground">Loading…</div>;
  const set = (k: string, v: any) => setC({ ...c, [k]: v });


  return (
    <div className="container-luxe py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl mt-2">Company</h1>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <Label>Company name</Label>
          <Input value={c.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Contact email</Label>
            <Input value={c.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Contact phone</Label>
            <Input value={c.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Brand color</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={c.brand_color ?? "#0a0a0a"}
              onChange={(e) => set("brand_color", e.target.value)}
              className="w-20 h-10 p-1"
            />
            <Input
              value={c.brand_color ?? ""}
              onChange={(e) => set("brand_color", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Logo</Label>
          {logoPreview && (
            <img src={logoPreview} alt="logo" className="h-16 mb-2 object-contain" />
          )}
          <Input type="file" accept="image/*" onChange={uploadLogo} />
          <p className="text-xs text-muted-foreground mt-1">
            Stored privately. Branded tour pages load it through a fresh short-lived link.
          </p>
        </div>

        <div className="flex items-center justify-between border rounded-md p-4 bg-muted/30">
          <div>
            <Label>Custom domain</Label>
            <p className="text-xs text-muted-foreground">Serve tour pages on your own domain.</p>
          </div>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      </Card>

      <Card className="p-6 space-y-4 mt-6">
        <div>
          <h2 className="font-display text-2xl">Public Domain Settings</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This is the domain used when generating MLS-safe tour links. Use your published domain
            or custom domain.
          </p>
        </div>
        <div>
          <Label>Public base URL</Label>
          <Input
            value={publicBase}
            onChange={(e) => setPublicBase(e.target.value)}
            placeholder={DEFAULT_PUBLIC_BASE_URL}
            className="font-mono text-sm"
          />
          {isPreviewUrl(publicBase) && (
            <p className="text-xs text-destructive mt-2">
              Warning: this is a preview URL and should not be used in MLS.
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setPublicBase(DEFAULT_PUBLIC_BASE_URL);
              setPublicBaseUrl(DEFAULT_PUBLIC_BASE_URL);
              toast.success("Reset to default");
            }}
          >
            Reset to default
          </Button>
          <Button
            onClick={() => {
              setPublicBaseUrl(publicBase);
              toast.success("Public base URL saved");
            }}
          >
            Save public domain
          </Button>
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
