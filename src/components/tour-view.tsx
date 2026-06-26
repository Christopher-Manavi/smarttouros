import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaEmbed } from "@/components/media-embed";
import { SmartImage } from "@/components/smart-image";


type Listing = any;
type Company = any;
type Tracking = any;
type Privacy = any;

function detectDevice(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

async function recordEvent(args: {
  listingId: string; companyId: string; pageType: "branded" | "unbranded";
  eventType: "page_view" | "media_click" | "video_play" | "cta_click" | "outbound_click";
}) {
  try {
    const params = new URLSearchParams(window.location.search);
    const visitorHash = localStorage.getItem("stos_vh") ?? (() => {
      const v = crypto.randomUUID(); localStorage.setItem("stos_vh", v); return v;
    })();
    await supabase.from("events").insert({
      listing_id: args.listingId,
      company_id: args.companyId,
      page_type: args.pageType,
      event_type: args.eventType,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
      user_agent: navigator.userAgent,
      device_type: detectDevice(navigator.userAgent),
      visitor_hash: visitorHash,
    });
  } catch (e) {
    // Analytics must never break the public page.
    console.warn("[tour] recordEvent failed", e);
  }
}

function injectScripts(tracking: Tracking | null, mode: "branded" | "unbranded") {
  if (!tracking) return () => {};
  const ok = mode === "branded" ? tracking.enable_branded_tracking : tracking.enable_unbranded_tracking;
  if (!ok) return () => {};
  const nodes: HTMLElement[] = [];
  const inject = (html: string | null | undefined, where: "head" | "body") => {
    if (!html) return;
    const div = document.createElement("div");
    div.innerHTML = html;
    Array.from(div.childNodes).forEach((n) => {
      if (n.nodeType === 1 && (n as HTMLElement).tagName === "SCRIPT") {
        const old = n as HTMLScriptElement;
        const s = document.createElement("script");
        if (old.src) s.src = old.src;
        if (old.type) s.type = old.type;
        if (old.async) s.async = true;
        s.text = old.text;
        (where === "head" ? document.head : document.body).appendChild(s);
        nodes.push(s);
      } else if (n.nodeType === 1) {
        (where === "head" ? document.head : document.body).appendChild(n);
        nodes.push(n as HTMLElement);
      }
    });
  };
  inject(tracking.custom_header_script, "head");
  inject(tracking.untitled_script, "head");
  inject(tracking.ga_script, "head");
  inject(tracking.meta_pixel_script, "head");
  inject(tracking.custom_footer_script, "body");
  return () => nodes.forEach((n) => n.remove());
}

export function TourView({
  listing, company, tracking, privacy, mode,
}: { listing: Listing; company: Company | null; tracking: Tracking | null; privacy: Privacy | null; mode: "branded" | "unbranded" }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!listing?.id || fired.current) return;
    fired.current = true;
    recordEvent({ listingId: listing.id, companyId: listing.company_id, pageType: mode, eventType: "page_view" });
    const cleanup = injectScripts(tracking, mode);
    return cleanup;
  }, [listing?.id, mode, tracking]);

  if (!listing) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Tour not found.</div>;
  }

  const unbranded = mode === "unbranded";
  const showAddress = !unbranded || listing.show_address_on_unbranded;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO MEDIA */}
      <section className="w-full bg-black">
        <div
          onClick={() => recordEvent({ listingId: listing.id, companyId: listing.company_id, pageType: mode, eventType: "media_click" })}
        >
          <MediaEmbed type={listing.primary_media_type} url={listing.primary_media_url} />
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16">
        {showAddress ? (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">For sale</p>
            <h1 className="font-display text-4xl md:text-6xl leading-tight">{listing.address}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
            </p>
          </>
        ) : (
          <h1 className="font-display text-4xl md:text-6xl">Featured property</h1>
        )}

        <div className="grid md:grid-cols-4 gap-6 mt-10 border-y py-6">
          {listing.price && (
            <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</div>
              <div className="font-display text-2xl mt-1">${Number(listing.price).toLocaleString()}</div></div>
          )}
          {listing.beds && <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beds</div><div className="font-display text-2xl mt-1">{listing.beds}</div></div>}
          {listing.baths && <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Baths</div><div className="font-display text-2xl mt-1">{listing.baths}</div></div>}
          {listing.sqft && <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Sqft</div><div className="font-display text-2xl mt-1">{Number(listing.sqft).toLocaleString()}</div></div>}
        </div>

        {listing.description && (
          <div className="mt-10 max-w-3xl">
            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}
      </section>

      {!!listing.gallery_urls?.length && (
        <section className="container-luxe pb-16">
          <h2 className="font-display text-3xl mb-6">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {listing.gallery_urls.map((u: string, i: number) => (
              <img key={i} src={u} loading="lazy" className="w-full h-72 object-cover" alt={`Photo ${i+1}`} />
            ))}
          </div>
        </section>
      )}

      {listing.secondary_media_url && (
        <section className="container-luxe pb-16">
          <h2 className="font-display text-3xl mb-6">More media</h2>
          <div onClick={() => recordEvent({ listingId: listing.id, companyId: listing.company_id, pageType: mode, eventType: "media_click" })}>
            <MediaEmbed type={listing.primary_media_type} url={listing.secondary_media_url} />
          </div>
        </section>
      )}

      {/* BRANDED-ONLY agent block */}
      {!unbranded && (listing.agent_name || listing.brokerage_name) && (
        <section className="border-t bg-muted/30">
          <div className="container-luxe py-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              {listing.brokerage_logo_url && <img src={listing.brokerage_logo_url} alt="" className="h-12 object-contain mb-4" />}
              {listing.brokerage_name && <p className="text-sm uppercase tracking-widest text-muted-foreground">{listing.brokerage_name}</p>}
              {listing.agent_name && <h3 className="font-display text-3xl mt-2">{listing.agent_name}</h3>}
              <div className="mt-4 space-y-1 text-sm">
                {listing.agent_phone && <p>{listing.agent_phone}</p>}
                {listing.agent_email && <p>{listing.agent_email}</p>}
              </div>
            </div>
            <div className="flex gap-3 md:justify-end">
              {listing.agent_email && (
                <a href={`mailto:${listing.agent_email}`}
                   onClick={() => recordEvent({ listingId: listing.id, companyId: listing.company_id, pageType: mode, eventType: "cta_click" })}
                   className="inline-flex items-center justify-center px-5 py-3 bg-primary text-primary-foreground rounded">
                  Request showing
                </a>
              )}
              {listing.agent_phone && (
                <a href={`tel:${listing.agent_phone}`}
                   onClick={() => recordEvent({ listingId: listing.id, companyId: listing.company_id, pageType: mode, eventType: "cta_click" })}
                   className="inline-flex items-center justify-center px-5 py-3 border rounded">
                  Call agent
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t py-10 text-xs text-muted-foreground">
        <div className="container-luxe flex flex-wrap justify-between gap-3">
          <span>{unbranded ? "Virtual tour" : (company?.name ?? "")}</span>
          <div className="flex gap-4">
            {privacy?.privacy_policy_url && <a href={privacy.privacy_policy_url} target="_blank" rel="noreferrer">Privacy</a>}
            {!unbranded && privacy?.terms_url && <a href={privacy.terms_url} target="_blank" rel="noreferrer">Terms</a>}
          </div>
        </div>
      </footer>

      {privacy?.show_privacy_notice && tracking?.enable_privacy_banner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-foreground text-background p-4 rounded shadow-lg text-xs">
          {privacy.privacy_notice_text}
        </div>
      )}
    </div>
  );
}

export async function loadTourBundle(slug: string) {
  const { data: listing } = await supabase
    .from("listings").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!listing) return { listing: null, company: null, tracking: null, privacy: null };
  const [{ data: company }, { data: tracking }, { data: privacy }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", listing.company_id).maybeSingle(),
    supabase.from("tracking_settings").select("*").eq("company_id", listing.company_id).maybeSingle(),
    supabase.from("privacy_settings").select("*").eq("company_id", listing.company_id).maybeSingle(),
  ]);
  return { listing, company, tracking, privacy };
}
