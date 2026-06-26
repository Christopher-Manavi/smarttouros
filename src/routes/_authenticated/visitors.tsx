import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCheck, BanIcon, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/visitors")({
  component: Visitors,
});

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const keys = ["name","email","phone","mailing_address","city","state","zip","status","first_seen_at","last_seen_at"];
  const head = keys.join(",");
  const body = rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")).join("\n");
  return head + "\n" + body;
}

export function Visitors() {
  const qc = useQueryClient();
  const { data: visitors = [] } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data } = await supabase.from("resolved_visitors").select("*").order("last_seen_at", { ascending: false });
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: "exported" | "suppressed") {
    const { error } = await supabase.from("resolved_visitors").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked as ${status}`); qc.invalidateQueries({ queryKey: ["visitors"] }); }
  }

  function exportCsv() {
    const csv = toCsv(visitors);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `visitors-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="container-luxe py-10">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Identity</p>
          <h1 className="font-display text-4xl mt-2">Resolved visitors</h1>
        </div>
        <Button onClick={exportCsv} variant="outline"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Connect your identity-resolution or analytics provider using tracking settings. Resolved
        records will appear here for export and CRM hand-off.
      </p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Location</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Last seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visitors.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">
                  No resolved visitors yet. Records will appear once your identity provider posts data.
                </td></tr>
              )}
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">{v.name ?? "—"}</td>
                  <td className="py-3 px-4">{v.email ?? "—"}</td>
                  <td className="py-3 px-4">{v.phone ?? "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{[v.city, v.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-3 px-4"><Badge variant={v.status === "new" ? "default" : "secondary"} className="capitalize">{v.status}</Badge></td>
                  <td className="py-3 px-4 text-right text-xs text-muted-foreground">{v.last_seen_at ? new Date(v.last_seen_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" title="Mark exported" onClick={() => setStatus(v.id, "exported")}><CheckCheck className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Suppress" onClick={() => setStatus(v.id, "suppressed")}><BanIcon className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Send to CRM (placeholder)" onClick={() => toast.info("CRM integration coming soon")}><Send className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
