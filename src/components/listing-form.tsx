import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { slugify, uniqueSuffix } from "@/lib/slug";
import { Upload, X, Youtube } from "lucide-react";
import { extractYouTubeId, isYouTubeUrl, isYouTubeShorts, youTubeEmbedUrl, normalizeYouTubeUrl, MediaEmbed } from "@/components/media-embed";

type ListingValues = {
  id?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  hero_image_url: string;
  gallery_urls: string[];
  primary_media_type: string;
  primary_media_url: string;
  secondary_media_url: string;
  agent_name: string;
  agent_phone: string;
  agent_email: string;
  brokerage_name: string;
  brokerage_logo_url: string;
  mls_number: string;
  status: "draft" | "active" | "archived";
  slug?: string;
  show_address_on_unbranded: boolean;
};

export const EMPTY_LISTING: ListingValues = {
  address: "", city: "", state: "", zip: "", price: "", beds: "", baths: "", sqft: "",
  description: "", hero_image_url: "", gallery_urls: [],
  primary_media_type: "youtube", primary_media_url: "", secondary_media_url: "",
  agent_name: "", agent_phone: "", agent_email: "",
  brokerage_name: "", brokerage_logo_url: "", mls_number: "",
  status: "active", show_address_on_unbranded: true,
};

async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("listing-media").getPublicUrl(path);
  return data.publicUrl;
}

export function ListingForm({
  initial,
  companyId,
}: { initial: ListingValues; companyId: string }) {
  const navigate = useNavigate();
  const [v, setV] = useState<ListingValues>(initial);
  const [busy, setBusy] = useState(false);
  const update = <K extends keyof ListingValues>(k: K, val: ListingValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function onHero(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await uploadFile(f, "hero"); update("hero_image_url", url); toast.success("Hero uploaded"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }
  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    try {
      const urls = await Promise.all(files.map((f) => uploadFile(f, "gallery")));
      update("gallery_urls", [...v.gallery_urls, ...urls]);
      toast.success(`${urls.length} image(s) added`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }

  async function save() {
    if (!v.address.trim()) { toast.error("Address is required"); return; }
    setBusy(true);
    try {
      const slug = v.slug ?? `${slugify(`${v.address} ${v.city} ${v.state}`)}-${uniqueSuffix()}`;
      const payload = {
        company_id: companyId,
        address: v.address, city: v.city, state: v.state, zip: v.zip,
        price: v.price ? Number(v.price) : null,
        beds: v.beds ? Number(v.beds) : null,
        baths: v.baths ? Number(v.baths) : null,
        sqft: v.sqft ? Number(v.sqft) : null,
        description: v.description || null,
        hero_image_url: v.hero_image_url || null,
        gallery_urls: v.gallery_urls,
        primary_media_type: v.primary_media_type as any,
        primary_media_url: v.primary_media_url || null,
        secondary_media_url: v.secondary_media_url || null,
        agent_name: v.agent_name || null, agent_phone: v.agent_phone || null, agent_email: v.agent_email || null,
        brokerage_name: v.brokerage_name || null, brokerage_logo_url: v.brokerage_logo_url || null,
        mls_number: v.mls_number || null,
        status: v.status,
        slug,
        show_address_on_unbranded: v.show_address_on_unbranded,
      };
      if (v.id) {
        const { error } = await supabase.from("listings").update(payload).eq("id", v.id);
        if (error) throw error;
        toast.success("Listing updated");
      } else {
        const { error } = await supabase.from("listings").insert(payload);
        if (error) throw error;
        toast.success("Listing created");
      }
      navigate({ to: "/listings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Property</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Address *</Label><Input value={v.address} onChange={(e) => update("address", e.target.value)} /></div>
          <div><Label>City</Label><Input value={v.city} onChange={(e) => update("city", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>State</Label><Input value={v.state} onChange={(e) => update("state", e.target.value)} /></div>
            <div><Label>ZIP</Label><Input value={v.zip} onChange={(e) => update("zip", e.target.value)} /></div>
          </div>
          <div><Label>Price (USD)</Label><Input type="number" value={v.price} onChange={(e) => update("price", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Beds</Label><Input type="number" value={v.beds} onChange={(e) => update("beds", e.target.value)} /></div>
            <div><Label>Baths</Label><Input type="number" step="0.5" value={v.baths} onChange={(e) => update("baths", e.target.value)} /></div>
            <div><Label>Sqft</Label><Input type="number" value={v.sqft} onChange={(e) => update("sqft", e.target.value)} /></div>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={5} value={v.description} onChange={(e) => update("description", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Media</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Hero image</Label>
            <div className="mt-1">
              {v.hero_image_url && <img src={v.hero_image_url} className="w-full h-48 object-cover rounded mb-2" />}
              <label className="flex items-center gap-2 border border-dashed rounded p-3 text-sm cursor-pointer hover:bg-muted/30">
                <Upload className="h-4 w-4" /> Upload hero
                <input type="file" accept="image/*" className="hidden" onChange={onHero} />
              </label>
            </div>
          </div>
          <div>
            <Label>Photo gallery</Label>
            <div className="mt-1">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {v.gallery_urls.map((u, i) => (
                  <div key={u} className="relative group">
                    <img src={u} className="w-full h-20 object-cover rounded" />
                    <button onClick={() => update("gallery_urls", v.gallery_urls.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 border border-dashed rounded p-3 text-sm cursor-pointer hover:bg-muted/30">
                <Upload className="h-4 w-4" /> Add photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={onGallery} />
              </label>
            </div>
          </div>

          <div>
            <Label>Primary media type</Label>
            <Select value={v.primary_media_type} onValueChange={(val) => update("primary_media_type", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="matterport">Matterport</SelectItem>
                <SelectItem value="mux">Mux</SelectItem>
                <SelectItem value="cloudpano">CloudPano</SelectItem>
                <SelectItem value="iframe">Custom iframe</SelectItem>
                <SelectItem value="video_url">Direct video URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Primary media URL</Label><Input value={v.primary_media_url} onChange={(e) => update("primary_media_url", e.target.value)} placeholder="https://..." /></div>
          <div className="md:col-span-2"><Label>Secondary media URL (optional)</Label><Input value={v.secondary_media_url} onChange={(e) => update("secondary_media_url", e.target.value)} /></div>

          {v.primary_media_url && (
            <div className="md:col-span-2 rounded-md border bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Media preview</div>
              {isYouTubeUrl(v.primary_media_url) ? (
                (() => {
                  const id = extractYouTubeId(v.primary_media_url);
                  if (!id) {
                    return <p className="text-sm text-destructive">YouTube URL detected but no video ID could be extracted.</p>;
                  }
                  const embed = youTubeEmbedUrl(id);
                  return (
                    <div className="space-y-3">
                      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div><dt className="text-muted-foreground">Platform</dt><dd>YouTube{isYouTubeShorts(v.primary_media_url) ? " (Shorts)" : ""}</dd></div>
                        <div><dt className="text-muted-foreground">Video ID</dt><dd className="font-mono">{id}</dd></div>
                        <div className="sm:col-span-3"><dt className="text-muted-foreground">Embed URL</dt><dd className="font-mono break-all">{embed}</dd></div>
                      </dl>
                      <MediaEmbed type="youtube" url={v.primary_media_url} />
                    </div>
                  );
                })()
              ) : (
                <MediaEmbed type={v.primary_media_type} url={v.primary_media_url} />
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Agent & brokerage</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Agent name</Label><Input value={v.agent_name} onChange={(e) => update("agent_name", e.target.value)} /></div>
          <div><Label>Agent phone</Label><Input value={v.agent_phone} onChange={(e) => update("agent_phone", e.target.value)} /></div>
          <div><Label>Agent email</Label><Input type="email" value={v.agent_email} onChange={(e) => update("agent_email", e.target.value)} /></div>
          <div><Label>Brokerage name</Label><Input value={v.brokerage_name} onChange={(e) => update("brokerage_name", e.target.value)} /></div>
          <div><Label>Brokerage logo URL</Label><Input value={v.brokerage_logo_url} onChange={(e) => update("brokerage_logo_url", e.target.value)} /></div>
          <div><Label>MLS number</Label><Input value={v.mls_number} onChange={(e) => update("mls_number", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Publishing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={v.status} onValueChange={(val) => update("status", val as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <Label className="block">Show address on unbranded page</Label>
              <p className="text-xs text-muted-foreground">Disable if your MLS forbids it.</p>
            </div>
            <Switch checked={v.show_address_on_unbranded} onCheckedChange={(c) => update("show_address_on_unbranded", c)} />
          </div>
        </div>
        <div className="mt-6 p-4 bg-muted/40 border-l-2 border-foreground text-sm">
          <strong>Note:</strong> Use the unbranded URL (<code>/u/[slug]</code>) for MLS virtual tour fields.
          Confirm local MLS rules before publishing.
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/listings" })}>Cancel</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : v.id ? "Save changes" : "Create listing"}</Button>
      </div>
    </div>
  );
}
