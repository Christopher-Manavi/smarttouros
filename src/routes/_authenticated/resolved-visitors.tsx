import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, CheckCircle2 } from "lucide-react";

const MOCK_VISITORS = [
  {
    date: "Jun 28, 2026",
    property: "8420 Sunset Blvd, Los Angeles, CA",
    buyerName: "Sarah Jenkins",
    phone: "(310) 555-0192",
    email: "s.jenkins@email.com",
  },
  {
    date: "Jun 27, 2026",
    property: "4200 Maple Dr, Austin, TX",
    buyerName: "Marcus Chen",
    phone: "(512) 555-0147",
    email: "mchen@email.com",
  },
  {
    date: "Jun 26, 2026",
    property: "112 Pine Street, Seattle, WA",
    buyerName: "Emily Davis",
    phone: "(206) 555-0134",
    email: "emily.d@email.com",
  },
  {
    date: "Jun 25, 2026",
    property: "8420 Sunset Blvd, Los Angeles, CA",
    buyerName: "Robert Ford",
    phone: "(310) 555-0178",
    email: "rford@email.com",
  },
  {
    date: "Jun 24, 2026",
    property: "77 W Chicago Ave, Chicago, IL",
    buyerName: "Lisa Wong",
    phone: "(312) 555-0165",
    email: "lisa.wong@email.com",
  },
  {
    date: "Jun 23, 2026",
    property: "4200 Maple Dr, Austin, TX",
    buyerName: "David Miller",
    phone: "(512) 555-0189",
    email: "dmiller@email.com",
  },
];

function toCsv(rows: typeof MOCK_VISITORS): string {
  const keys = ["date", "property", "buyerName", "phone", "email"] as const;
  const head = keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(",");
  const body = rows
    .map((r) => keys.map((k) => JSON.stringify(r[k])).join(","))
    .join("\n");
  return head + "\n" + body;
}

export const Route = createFileRoute("/_authenticated/resolved-visitors")({
  component: Visitors,
});

function Visitors() {
  const [lenderModalOpen, setLenderModalOpen] = useState(false);
  const [sponsorSuccess, setSponsorSuccess] = useState(false);
  const [lenderName, setLenderName] = useState("");
  const [lenderEmail, setLenderEmail] = useState("");

  function openLenderModal() {
    setSponsorSuccess(false);
    setLenderName("");
    setLenderEmail("");
    setLenderModalOpen(true);
  }

  function handleSponsorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSponsorSuccess(true);
  }

  function closeModal() {
    setLenderModalOpen(false);
    setTimeout(() => setSponsorSuccess(false), 300);
  }

  function exportCsv() {
    const csv = toCsv(MOCK_VISITORS);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0A0A0A] text-white">
      <div className="container-luxe py-10">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Identity
            </p>
            <h1 className="font-display text-4xl mt-2 text-white">
              Resolved visitors
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={exportCsv}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all"
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        <p className="text-sm text-neutral-400 mb-8 max-w-2xl">
          Connect your identity-resolution or analytics provider using tracking
          settings. Resolved records will appear here for export and CRM hand-off.
        </p>

        <Card className="overflow-hidden relative bg-[#111114] border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Property Looked At
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Buyer Name</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_VISITORS.map((v, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 text-neutral-300">{v.date}</td>
                    <td className="py-3 px-4 text-neutral-300">{v.property}</td>
                    <td className="py-3 px-4 blur-md select-none opacity-50 text-neutral-300">
                      {v.buyerName}
                    </td>
                    <td className="py-3 px-4 blur-md select-none opacity-50 text-neutral-300">
                      {v.phone}
                    </td>
                    <td className="py-3 px-4 blur-md select-none opacity-50 text-neutral-300">
                      {v.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paywall Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 animate-in fade-in duration-300">
            <div className="bg-[#111114] border border-white/10 rounded-xl p-8 max-w-md text-center shadow-2xl mx-4 animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                You have 14 unresolved buyer leads.
              </h2>
              <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                Upgrade your account to instantly reveal buyer names, phone
                numbers, and emails.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => console.log("Unlock leads clicked")}
                  className="w-full h-12 text-base font-semibold text-white border-0 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                >
                  Unlock Leads - $49/mo
                </Button>
                <Button
                  variant="outline"
                  onClick={openLenderModal}
                  className="w-full h-11 border-purple-500/50 text-purple-400 bg-transparent hover:bg-purple-500/10 hover:text-purple-300 transition-all"
                >
                  Unlock for FREE via Lender Sponsor
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lender Sponsorship Modal */}
      <Dialog open={lenderModalOpen} onOpenChange={setLenderModalOpen}>
        <DialogContent className="bg-[#111114] border-white/10 text-white sm:max-w-md p-0 overflow-hidden [&>button]:text-white">
          <div className="p-6">
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-xl text-white">
                Invite Your Lender to Sponsor You
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-400 leading-relaxed">
                Enter your preferred mortgage broker's details. We will send them a
                request to sponsor your $49/mo account in exchange for
                co-working these buyer leads.
              </DialogDescription>
            </DialogHeader>

            {!sponsorSuccess ? (
              <form onSubmit={handleSponsorSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="lender-name"
                    className="text-sm text-neutral-300"
                  >
                    Lender Name
                  </Label>
                  <Input
                    id="lender-name"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="John Smith"
                    required
                    className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500 focus-visible:ring-1 focus-visible:ring-offset-0 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lender-email"
                    className="text-sm text-neutral-300"
                  >
                    Lender Email
                  </Label>
                  <Input
                    id="lender-email"
                    type="email"
                    value={lenderEmail}
                    onChange={(e) => setLenderEmail(e.target.value)}
                    placeholder="john@localmortgage.com"
                    required
                    className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500 focus-visible:ring-1 focus-visible:ring-offset-0 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold text-white border-0 bg-[#8B5CF6] hover:bg-[#7c4ddb] transition-all shadow-lg shadow-purple-500/20"
                >
                  Send Sponsorship Request
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Request Sent!
                </h3>
                <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
                  We will notify you as soon as your lender unlocks your account.
                </p>
                <Button
                  onClick={closeModal}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5 hover:text-white mt-2 transition-all"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
