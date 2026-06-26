import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { tourUrls } from "@/lib/demo-listing";
import { PublicAccessPanel } from "@/components/public-access-panel";
import { toast } from "sonner";

const search = z.object({ slug: z.string() });

export const Route = createFileRoute("/_authenticated/demo")({
  validateSearch: search,
  component: DemoSuccess,
});

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="lg"
      className="w-full h-14 text-base"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Copy failed");
        }
      }}
    >
      {done ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
      {label}
    </Button>
  );
}

function DemoSuccess() {
  const { slug } = Route.useSearch();
  const { branded, unbranded } = tourUrls(slug);

  return (
    <div className="container-luxe py-10 max-w-3xl">
      <Link to="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>
      <div className="mt-6 mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Demo listing created</p>
        <h1 className="font-display text-4xl mt-2">12349 Longmire Trace</h1>
        <p className="text-muted-foreground mt-1">Conroe, TX 77304 · Status: Active</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Branded tour URL</p>
          <Input readOnly value={branded} className="font-mono text-xs" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <CopyBtn value={branded} label="Copy Branded Tour URL" />
          <Button asChild size="lg" variant="outline" className="h-14 text-base">
            <a href={branded} target="_blank" rel="noreferrer">
              <ExternalLink className="h-5 w-5 mr-2" /> Open Branded Tour
            </a>
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4 mt-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Unbranded MLS URL</p>
          <Input readOnly value={unbranded} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground mt-2">
            MLS-safe: no agent name, phone, email, brokerage name, brokerage logo, or contact CTAs.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <CopyBtn value={unbranded} label="Copy Unbranded MLS URL" />
          <Button asChild size="lg" variant="outline" className="h-14 text-base">
            <a href={unbranded} target="_blank" rel="noreferrer">
              <ExternalLink className="h-5 w-5 mr-2" /> Open Unbranded MLS Tour
            </a>
          </Button>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link to="/test-center">Run MVP test checklist</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/listings">View all listings</Link>
        </Button>
      </div>
    </div>
  );
}
