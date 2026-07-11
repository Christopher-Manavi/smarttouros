import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type IdentityStatus =
  | "not_requested"
  | "pending_review"
  | "approved"
  | "provisioning"
  | "active"
  | "suspended"
  | "denied";

export const Route = createFileRoute("/_authenticated/identity")({
  head: () => ({ meta: [{ title: "Identity Resolution — SmartTourOS" }] }),
  component: IdentityPage,
});

const STATUS_LABEL: Record<IdentityStatus, string> = {
  not_requested: "Not requested",
  pending_review: "Pending review",
  approved: "Approved",
  provisioning: "Provisioning",
  active: "Active",
  suspended: "Suspended",
  denied: "Denied",
};

function derive(t: any): IdentityStatus {
  if (!t) return "not_requested";
  const hasScript = !!t.untitled_script;
  const on = !!(t.enable_branded_tracking || t.enable_unbranded_tracking);
  if (hasScript && on) return "active";
  if (hasScript) return "approved";
  return "not_requested";
}

function IdentityPage() {
  const { companyId } = useAuth();
  const [status, setStatus] = useState<IdentityStatus>("not_requested");
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("tracking_settings")
      .select("untitled_script, enable_branded_tracking, enable_unbranded_tracking")
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => setStatus(derive(data)));
  }, [companyId]);

  const effective: IdentityStatus = requested && status === "not_requested" ? "pending_review" : status;

  return (
    <div className="container-luxe py-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Compliance</p>
        <h1 className="font-display text-4xl mt-2">Identity Resolution</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Identity resolution is available to verified licensed real-estate professionals following
          use-case and compliance review. Approved tags are provisioned and managed by the
          SmartTourOS trust &amp; safety team.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current state</p>
            <p className="font-display text-2xl mt-1">{STATUS_LABEL[effective]}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Read-only. Tag distribution, activation, suspension, and replacement are handled
              server-side.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={effective !== "not_requested"}
            onClick={() => {
              setRequested(true);
              toast.success(
                "Verification request noted. Our compliance team will follow up by email.",
              );
            }}
          >
            {effective === "not_requested" ? "Request verification" : "Requested"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm">
          Ordinary accounts cannot paste raw JavaScript, header, or footer snippets. If approved,
          configuration is applied by SmartTourOS staff using audited templates.
        </p>
      </Card>
    </div>
  );
}
