import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { slugify, uniqueSuffix } from "@/lib/slug";
import { Upload, X, Youtube } from "lucide-react";
import {
  extractYouTubeId,
  isYouTubeUrl,
  isYouTubeShorts,
  youTubeEmbedUrl,
  normalizeYouTubeUrl,
  MediaEmbed,
} from "@/components/media-embed";
import { useStorageSignedUrl, useStorageSignedUrls } from "@/lib/storage-preview";

export type ListingValues = {
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
  hero_image_storage_path: string | null;
  gallery_storage_paths: string[];
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
  address: "",
  city: "",
  state: "",
  zip: "",
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  description: "",
  hero_image_storage_path: null,
  gallery_storage_paths: [],
  primary_media_type: "youtube",
  primary_media_url: "",
  secondary_media_url: "",
  agent_name: "",
  agent_phone: "",
  agent_email: "",
  brokerage_name: "",
  brokerage_logo_url: "",
  mls_number: "",
  status: "active",
  show_address_on_unbranded: true,
};

type UploadResult = {
  path: string;
  width?: number;
  height?: number;
  filename: string;
  size: number;
};

async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

async function uploadFile(
  file: File,
  companyId: string,
  listingId: string,
): Promise<UploadResult> {
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  // Storage lives at {company_id}/{listing_id}/{uuid}.ext — matches the
  // storage RLS policy which requires the first folder segment to equal the
  // caller's own company_id.
  const path = `${companyId}/${listingId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("listing-media")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const dims = await readImageDimensions(file);
  return {
    path,
    filename: file.name,
    size: file.size,
    width: dims?.width,
    height: dims?.height,
  };
}

export function ListingForm({
  initial,
  companyId,
  highlightMedia,
}: {
  initial: ListingValues;
  companyId: string;
  highlightMedia?: boolean;
}) {
  const navigate = useNavigate();
  // Pre-generate a stable listing id so uploads can be stored at the final
  // {company_id}/{listing_id}/… path even before the row is inserted.
  const listingId = useMemo(() => initial.id ?? crypto.randomUUID(), [initial.id]);
  const isNew = !initial.id;
  const [v, setV] = useState<ListingValues>(initial);
  const [busy, setBusy] = useState(false);
  const [ytQuick, setYtQuick] = useState("");
  const mediaSectionRef = useRef<HTMLDivElement>(null);
  const update = <K extends keyof ListingValues>(k: K, val: ListingValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const heroPreview = useStorageSignedUrl("listing-media", v.hero_image_storage_path);
  const galleryPreviews = useStorageSignedUrls("listing-media", v.gallery_storage_paths);

  useEffect(() => {
    if (highlightMedia && mediaSectionRef.current) {
      mediaSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightMedia]);

  function applyYouTubeQuick() {
    const raw = ytQuick.trim();
    if (!raw) {
      toast.error("Paste a YouTube or Shorts URL");
      return;
    }
    if (!isYouTubeUrl(raw)) {
      toast.error("That doesn't look like a YouTube URL");
      return;
    }
    const normalized = normalizeYouTubeUrl(raw);
    if (!normalized) {
      toast.error("Could not extract video ID");
      return;
    }
    update("primary_media_type", "youtube");
    update("primary_media_url", normalized);
    toast.success(isYouTubeShorts(raw) ? "Vertical Shorts video added" : "YouTube video added");
    mediaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const [heroMeta, setHeroMeta] = useState<UploadResult | null>(null);
  const [galleryMeta, setGalleryMeta] = useState<UploadResult[]>([]);

  async function onHero(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadFile(f, companyId, listingId);
      update("hero_image_storage_path", res.path);
      setHeroMeta(res);
      toast.success(
        `Upload successful · ${res.filename}${res.width ? ` · ${res.width}×${res.height}` : ""}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }
  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      const results = await Promise.all(files.map((f) => uploadFile(f, companyId, listingId)));
      update("gallery_storage_paths", [
        ...v.gallery_storage_paths,
        ...results.map((r) => r.path),
      ]);
      setGalleryMeta((prev) => [...prev, ...results]);
      toast.success(`${results.length} image(s) added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function save() {
    if (!v.address.trim()) {
      toast.error("Address is required");
      return;
    }
    setBusy(true);
    try {
      const slug = v.slug ?? `${slugify(`${v.address} ${v.city} ${v.state}`)}-${uniqueSuffix()}`;
      const payload = {
        id: listingId,
        company_id: companyId,
        address: v.address,
        city: v.city,
        state: v.state,
        zip: v.zip,
        price: v.price ? Number(v.price) : null,
        beds: v.beds ? Number(v.beds) : null,
        baths: v.baths ? Number(v.baths) : null,
        sqft: v.sqft ? Number(v.sqft) : null,
        description: v.description || null,
        // Legacy *_url columns are for external URLs only. Storage-hosted
        // media lives in *_storage_path columns.
        hero_image_url: null,
        gallery_urls: [] as string[],
        hero_image_storage_path: v.hero_image_storage_path,
        gallery_storage_paths: v.gallery_storage_paths,
        primary_media_type: v.primary_media_type as any,
        primary_media_url: v.primary_media_url || null,
        secondary_media_url: v.secondary_media_url || null,
        agent_name: v.agent_name || null,
        agent_phone: v.agent_phone || null,
        agent_email: v.agent_email || null,
        brokerage_name: v.brokerage_name || null,
        brokerage_logo_url: v.brokerage_logo_url || null,
        mls_number: v.mls_number || null,
        status: v.status,
        slug,
        show_address_on_unbranded: v.show_address_on_unbranded,
      };
      if (!isNew) {
        const { error } = await supabase.from("listings").update(payload).eq("id", listingId);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-foreground/20 bg-muted/30">
        <div className="flex items-start gap-3 mb-3">
          <Youtube className="h-5 w-5 mt-0.5 text-foreground" />
          <div>
            <h2 className="font-display text-xl">Have a YouTube or Shorts video?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paste it below and we'll embed it automatically. Then finish the listing details and
              generate your branded and MLS-safe URLs.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={ytQuick}
            onChange={(e) => setYtQuick(e.target.value)}
            placeholder="https://youtube.com/shorts/… or https://youtu.be/…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyYouTubeQuick();
              }
            }}
          />
          <Button type="button" onClick={applyYouTubeQuick}>
            Use this video
          </Button>
        </div>
        {v.primary_media_url && isYouTubeUrl(v.primary_media_url) && (
          <p className="text-xs text-muted-foreground mt-2">
            {isYouTubeShorts(v.primary_media_url) ? "Vertical video detected · " : ""}
            Embed ready in the Media section below.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Property</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Address *</Label>
            <Input value={v.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={v.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>State</Label>
              <Input value={v.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={v.zip} onChange={(e) => update("zip", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Price (USD)</Label>
            <Input
              type="number"
              value={v.price}
              onChange={(e) => update("price", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Beds</Label>
              <Input
                type="number"
                value={v.beds}
                onChange={(e) => update("beds", e.target.value)}
              />
            </div>
            <div>
              <Label>Baths</Label>
              <Input
                type="number"
                step="0.5"
                value={v.baths}
                onChange={(e) => update("baths", e.target.value)}
              />
            </div>
            <div>
              <Label>Sqft</Label>
              <Input
                type="number"
                value={v.sqft}
                onChange={(e) => update("sqft", e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={5}
              value={v.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card
        ref={mediaSectionRef}
        className={`p-6 scroll-mt-6 ${highlightMedia ? "ring-2 ring-foreground/40" : ""}`}
      >
        <h2 className="font-display text-2xl mb-4">Media</h2>

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground mb-4 space-y-1">
          <p>
            <strong className="text-foreground">Hero image:</strong> 1600×900 minimum · 16:9
            landscape preferred · JPG, PNG, or WebP.
          </p>
          <p>
            <strong className="text-foreground">Gallery photos:</strong> 1200px wide minimum · JPG,
            PNG, or WebP · landscape preferred (portrait works too).
          </p>
          <p>Screenshots and imperfectly sized images are fine — we'll center-crop them cleanly.</p>
          <p className="pt-1 border-t border-border/60">
            Photos are stored privately. Public tour pages load them through short-lived signed
            links that expire in 60 minutes — draft and archived listings are never anonymously
            accessible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Hero image</Label>
            <div className="mt-1">
              {v.hero_image_storage_path && (
                <div className="mb-2">
                  <div className="aspect-video w-full overflow-hidden rounded bg-muted">
                    {heroPreview ? (
                      <img
                        src={heroPreview}
                        className="w-full h-full object-cover"
                        alt="Hero preview"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Loading preview…
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {heroMeta
                        ? `✓ ${heroMeta.filename}${heroMeta.width ? ` · ${heroMeta.width}×${heroMeta.height}` : ""}`
                        : "Stored privately"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        update("hero_image_storage_path", null);
                        setHeroMeta(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 border border-dashed rounded p-3 text-sm cursor-pointer hover:bg-muted/30">
                <Upload className="h-4 w-4" /> Upload hero
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onHero}
                />
              </label>
            </div>
          </div>
          <div>
            <Label>Photo gallery</Label>
            <div className="mt-1">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {v.gallery_storage_paths.map((p, i) => {
                  const meta = galleryMeta.find((m) => m.path === p);
                  const preview = galleryPreviews[i];
                  return (
                    <div key={p} className="relative group">
                      <div className="aspect-square w-full overflow-hidden rounded bg-muted">
                        {preview ? (
                          <img
                            src={preview}
                            className="w-full h-full object-cover"
                            alt={meta?.filename ?? ""}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground">
                            …
                          </div>
                        )}
                      </div>
                      {meta && (
                        <p
                          className="text-[10px] text-muted-foreground mt-0.5 truncate"
                          title={`${meta.filename}${meta.width ? ` · ${meta.width}×${meta.height}` : ""}`}
                        >
                          {meta.filename}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          update(
                            "gallery_storage_paths",
                            v.gallery_storage_paths.filter((_, j) => j !== i),
                          );
                          setGalleryMeta((prev) => prev.filter((m) => m.path !== p));
                        }}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <label className="flex items-center gap-2 border border-dashed rounded p-3 text-sm cursor-pointer hover:bg-muted/30">
                <Upload className="h-4 w-4" /> Add photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={onGallery}
                />
              </label>
            </div>
          </div>

          <div>
            <Label>Primary media type</Label>
            <Select
              value={v.primary_media_type}
              onValueChange={(val) => update("primary_media_type", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
          <div>
            <Label>Primary media URL</Label>
            <Input
              value={v.primary_media_url}
              onChange={(e) => update("primary_media_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Secondary media URL (optional)</Label>
            <Input
              value={v.secondary_media_url}
              onChange={(e) => update("secondary_media_url", e.target.value)}
            />
          </div>

          {v.primary_media_url && (
            <div className="md:col-span-2 rounded-md border bg-muted/30 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Media preview
              </div>
              {isYouTubeUrl(v.primary_media_url) ? (
                (() => {
                  const id = extractYouTubeId(v.primary_media_url);
                  if (!id) {
                    return (
                      <p className="text-sm text-destructive">
                        YouTube URL detected but no video ID could be extracted.
                      </p>
                    );
                  }
                  const embed = youTubeEmbedUrl(id);
                  return (
                    <div className="space-y-3">
                      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Platform</dt>
                          <dd>YouTube{isYouTubeShorts(v.primary_media_url) ? " (Shorts)" : ""}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Video ID</dt>
                          <dd className="font-mono">{id}</dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-muted-foreground">Embed URL</dt>
                          <dd className="font-mono break-all">{embed}</dd>
                        </div>
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
          <div>
            <Label>Agent name</Label>
            <Input value={v.agent_name} onChange={(e) => update("agent_name", e.target.value)} />
          </div>
          <div>
            <Label>Agent phone</Label>
            <Input value={v.agent_phone} onChange={(e) => update("agent_phone", e.target.value)} />
          </div>
          <div>
            <Label>Agent email</Label>
            <Input
              type="email"
              value={v.agent_email}
              onChange={(e) => update("agent_email", e.target.value)}
            />
          </div>
          <div>
            <Label>Brokerage name</Label>
            <Input
              value={v.brokerage_name}
              onChange={(e) => update("brokerage_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Brokerage logo URL</Label>
            <Input
              value={v.brokerage_logo_url}
              onChange={(e) => update("brokerage_logo_url", e.target.value)}
              placeholder="https://brokerage.example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground mt-1">
              External URL only. Uploaded files aren't accepted here.
            </p>
          </div>
          <div>
            <Label>MLS number</Label>
            <Input value={v.mls_number} onChange={(e) => update("mls_number", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl mb-4">Publishing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={v.status} onValueChange={(val) => update("status", val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Switch
              checked={v.show_address_on_unbranded}
              onCheckedChange={(c) => update("show_address_on_unbranded", c)}
            />
          </div>
        </div>
        <div className="mt-6 p-4 bg-muted/40 border-l-2 border-foreground text-sm">
          <strong>Note:</strong> Use the unbranded URL (<code>/u/[slug]</code>) for MLS virtual tour
          fields. Confirm local MLS rules before publishing.
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/listings" })}>
          Cancel
        </Button>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : !isNew ? "Save changes" : "Create listing"}
        </Button>
      </div>
    </div>
  );
}
