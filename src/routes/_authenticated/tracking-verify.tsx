import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle, Copy } from "lucide-react";
import { DEMO_MLS } from "@/lib/demo-listing";
import { brandedTourUrl, unbrandedTourUrl } from "@/lib/public-url";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tracking-verify")({
  component: TrackingVerify,
});

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function TrackingVerify() {
  const { companyId } = useAuth();
  const [tracking, setTracking] = useState<any>(null);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      const [{ data: t }, { data: l }] = await Promise.all([
        supabase.from("tracking_settings").select("*").eq("company_id", companyId).maybeSingle(),
        supabase
          .from("listings")
          .select("slug")
          .eq("company_id", companyId)
          .eq("mls_number", DEMO_MLS)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setTracking(t);
      if (l?.slug) setSlug(l.slug);
    })();
  }, [companyId]);

  const branded = slug ? brandedTourUrl(slug) : "";
  const unbranded = slug ? unbrandedTourUrl(slug) : "";

  const hasAnyScript = !!(
    tracking &&
    (tracking.custom_header_script ||
      tracking.custom_footer_script ||
      tracking.untitled_script ||
      tracking.ga_script ||
      tracking.meta_pixel_script)
  );
  const brandedOn = !!tracking?.enable_branded_tracking;
  const unbrandedOn = !!tracking?.enable_unbranded_tracking;

  function copy(v: string) {
    void navigator.clipboard.writeText(v);
    toast.success("Copied");
  }

  return (
    <div className="container-luxe py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">QA</p>
        <h1 className="font-display text-4xl mt-2">Tracking Verification</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Confirm custom tracking scripts fire on public branded and unbranded MLS pages.
        </p>
      </div>

      <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/5 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm">
          Only install third-party identity or advertising tags after confirming privacy policy,
          client authorization, and applicable MLS/advertising rules.
        </p>
      </Card>

      <Card className="p-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Current settings
        </p>
        <ul className="space-y-2">
          <Row ok={hasAnyScript} label="At least one tracking script configured" />
          <Row ok={brandedOn} label="Tracking enabled on branded pages" />
          <Row ok={unbrandedOn} label="Tracking enabled on unbranded MLS pages" />
        </ul>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tracking">Edit tracking settings</Link>
          </Button>
        </div>
      </Card>

      <Card className="p-5 mb-6 space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Public URLs to verify
        </p>
        {slug ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Branded</p>
              <div className="flex gap-2">
                <Input readOnly value={branded} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(branded)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <a href={branded} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Unbranded MLS</p>
              <div className="flex gap-2">
                <Input readOnly value={unbranded} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(unbranded)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <a href={unbranded} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Use this MLS-safe link in the MLS Virtual Tour / Unbranded Tour field.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No demo listing found.{" "}
            <Link to="/test-center" className="underline">
              Create one
            </Link>{" "}
            to get verifiable URLs.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          How to verify
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            Open <strong>Tracking</strong> and click <strong>Insert Test Tracking Script</strong>,
            then Save.
          </li>
          <li>Enable the toggles for branded and/or unbranded pages, then Save.</li>
          <li>
            Open each public URL above in a <strong>Guest / Incognito</strong> browser window.
          </li>
          <li>
            Open DevTools → Console. You should see:{" "}
            <code className="font-mono text-foreground">SmartTourOS tracking script fired</code>
          </li>
          <li>
            In the Console, type{" "}
            <code className="font-mono text-foreground">window.smartTourTrackingTest</code> — it
            should return <code className="font-mono text-foreground">true</code>.
          </li>
          <li>
            Confirm the page still renders normally and a page_view is recorded (see{" "}
            <Link to="/test-center" className="underline">
              MVP Test Center
            </Link>
            ).
          </li>
        </ol>
      </Card>
    </div>
  );
}
