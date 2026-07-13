import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Sparkles,
  Send,
  UsersRound,
  Landmark,
  ListChecks,
  Mail,
  ScrollText,
} from "lucide-react";
import { getCampaign, setCampaignStatus } from "@/lib/sponsorship/campaigns.functions";
import {
  listAgents,
  importAgentsBulk,
  deleteAgent,
} from "@/lib/sponsorship/agents.functions";
import {
  listLenders,
  importLendersBulk,
  deleteLender,
} from "@/lib/sponsorship/lenders.functions";
import {
  listMatches,
  previewMatches,
  previewMatchEmails,
  commitMatches,
  setMatchStatus,
} from "@/lib/sponsorship/matches.functions";
import { listAuditEvents } from "@/lib/sponsorship/audit.functions";
import { parseCsv } from "@/lib/sponsorship/csv";
import { deriveOfferDisplay, type SponsorshipMatchStatus } from "@/lib/sponsorship/status";

const searchSchema = z.object({
  tab: z
    .enum(["agents", "lenders", "matches", "preview", "audit"])
    .optional()
    .default("agents"),
});

export const Route = createFileRoute("/_authenticated/_super_admin/sponsorship/$campaignId")({
  validateSearch: (raw) => searchSchema.parse(raw),
  component: CampaignDetail,
});

type Campaign = Awaited<ReturnType<typeof getCampaign>>;
type Agent = Awaited<ReturnType<typeof listAgents>>[number];
type Lender = Awaited<ReturnType<typeof listLenders>>[number];
type MatchRow = Awaited<ReturnType<typeof listMatches>>[number];
type AuditRow = Awaited<ReturnType<typeof listAuditEvents>>[number];

const TABS = [
  { id: "agents", label: "Agents", icon: UsersRound },
  { id: "lenders", label: "Lenders", icon: Landmark },
  { id: "matches", label: "Matches", icon: ListChecks },
  { id: "preview", label: "Email Preview", icon: Mail },
  { id: "audit", label: "Audit Log", icon: ScrollText },
] as const;

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const get = useServerFn(getCampaign);
  const setStatus = useServerFn(setCampaignStatus);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reloadCampaign = useCallback(async () => {
    try {
      const c = await get({ data: { id: campaignId } });
      setCampaign(c as Campaign);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [get, campaignId]);

  useEffect(() => {
    void reloadCampaign();
  }, [reloadCampaign]);

  return (
    <div className="container-luxe py-10 max-w-6xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/sponsorship">
          <ArrowLeft className="h-4 w-4 mr-1" />
          All campaigns
        </Link>
      </Button>

      {error && <Card className="p-4 mb-4 text-sm text-destructive">{error}</Card>}

      {campaign && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Campaign</p>
              <h1 className="font-display text-3xl mt-1">{campaign.campaign_name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {[campaign.market_city, campaign.market_state].filter(Boolean).join(", ") ||
                  "No market set"}
                {campaign.zip_codes?.length ? ` · ${campaign.zip_codes.length} ZIPs` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                {campaign.status}
              </Badge>
              <StatusMenu
                current={campaign.status}
                onChange={async (s) => {
                  try {
                    await setStatus({ data: { id: campaign.id, status: s } });
                    toast.success(`Status → ${s}`);
                    await reloadCampaign();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b mb-6">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/sponsorship/$campaignId",
                      params: { campaignId },
                      search: { tab: t.id },
                    })
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "agents" && <AgentsTab campaignId={campaignId} />}
          {tab === "lenders" && <LendersTab campaignId={campaignId} />}
          {tab === "matches" && <MatchesTab campaignId={campaignId} />}
          {tab === "preview" && <PreviewTab campaignId={campaignId} />}
          {tab === "audit" && <AuditTab campaignId={campaignId} />}
        </>
      )}
    </div>
  );
}

const CAMPAIGN_STATUSES = [
  "draft",
  "matching",
  "review",
  "sending_agents",
  "closed",
  "archived",
] as const;

function StatusMenu({
  current,
  onChange,
}: {
  current: string;
  onChange: (s: (typeof CAMPAIGN_STATUSES)[number]) => void;
}) {
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value as (typeof CAMPAIGN_STATUSES)[number])}
      className="h-8 rounded-md border bg-background px-2 text-xs"
      aria-label="Change campaign status"
    >
      {CAMPAIGN_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

// -----------------------------------------------------------------------
// Agents Tab
// -----------------------------------------------------------------------
function AgentsTab({ campaignId }: { campaignId: string }) {
  const list = useServerFn(listAgents);
  const importBulk = useServerFn(importAgentsBulk);
  const del = useServerFn(deleteAgent);

  const [rows, setRows] = useState<Agent[]>([]);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const r = await list({ data: { campaign_id: campaignId } });
    setRows(r as Agent[]);
  }, [list, campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function doImport() {
    setBusy(true);
    try {
      const parsed = parseCsv(csv);
      if (parsed.length === 0) {
        toast.error("No CSV rows detected. Header row required.");
        return;
      }
      const res = await importBulk({ data: { campaign_id: campaignId, rows: parsed } });
      toast.success(
        `Imported ${res.inserted} · skipped ${res.skipped_existing} · errors ${
          Array.isArray(res.errors) ? res.errors.length : 0
        }`,
      );
      setCsv("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-medium mb-2">Paste CSV (with header row)</p>
        <p className="text-xs text-muted-foreground mb-2">
          Columns: <code>email</code>, first_name, last_name, phone, brokerage, city, state,
          postal_code, listing_count, profile_url. Duplicates in the same campaign are skipped
          server-side.
        </p>
        <Textarea
          rows={5}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="email,first_name,last_name,city,state,postal_code&#10;a@example.com,Jane,Doe,Denver,CO,80202"
          className="font-mono text-xs"
        />
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={doImport} disabled={busy || csv.trim().length === 0}>
            {busy ? "Importing…" : "Import CSV"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Market</th>
              <th className="text-left p-3">Listings</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No agents in this campaign yet.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-mono text-xs">{a.email}</td>
                <td className="p-3">
                  {[a.first_name, a.last_name].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {[a.city, a.state, a.postal_code].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="p-3 text-xs">{a.listing_count ?? "—"}</td>
                <td className="p-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm(`Remove ${a.email}?`)) return;
                      try {
                        await del({ data: { id: a.id } });
                        toast.success("Removed");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                    aria-label="Remove agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------
// Lenders Tab
// -----------------------------------------------------------------------
function LendersTab({ campaignId }: { campaignId: string }) {
  const list = useServerFn(listLenders);
  const importBulk = useServerFn(importLendersBulk);
  const del = useServerFn(deleteLender);

  const [rows, setRows] = useState<Lender[]>([]);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const r = await list({ data: { campaign_id: campaignId } });
    setRows(r as Lender[]);
  }, [list, campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function doImport() {
    setBusy(true);
    try {
      const parsed = parseCsv(csv);
      if (parsed.length === 0) {
        toast.error("No CSV rows detected. Header row required.");
        return;
      }
      const res = await importBulk({ data: { campaign_id: campaignId, rows: parsed } });
      toast.success(
        `Imported ${res.inserted} · skipped ${res.skipped_existing} · errors ${
          Array.isArray(res.errors) ? res.errors.length : 0
        }`,
      );
      setCsv("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-medium mb-2">Paste CSV (with header row)</p>
        <p className="text-xs text-muted-foreground mb-2">
          Columns: <code>email</code>, first_name, last_name, phone, company, nmls_number, city,
          state, service_areas (pipe-separated), service_zip_codes (space or comma). NMLS must be
          5–10 digits when supplied.
        </p>
        <Textarea
          rows={5}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="email,first_name,last_name,company,nmls_number,service_zip_codes&#10;lender@example.com,Sam,Yu,Anywhere Mortgage,123456,80202 80203 80204"
          className="font-mono text-xs"
        />
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={doImport} disabled={busy || csv.trim().length === 0}>
            {busy ? "Importing…" : "Import CSV"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Coverage</th>
              <th className="text-left p-3">Cap</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No lenders in this campaign yet.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 font-mono text-xs">{l.email}</td>
                <td className="p-3">{l.company ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {[l.city, l.state].filter(Boolean).join(", ")}
                  {l.service_zip_codes?.length
                    ? ` · ${l.service_zip_codes.length} ZIPs`
                    : ""}
                </td>
                <td className="p-3 text-xs">{l.max_current_sponsorships}</td>
                <td className="p-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm(`Remove ${l.email}?`)) return;
                      try {
                        await del({ data: { id: l.id } });
                        toast.success("Removed");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                    aria-label="Remove lender"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------
// Matches Tab
// -----------------------------------------------------------------------
function MatchesTab({ campaignId }: { campaignId: string }) {
  const list = useServerFn(listMatches);
  const preview = useServerFn(previewMatches);
  const commit = useServerFn(commitMatches);
  const setMS = useServerFn(setMatchStatus);

  const [rows, setRows] = useState<MatchRow[]>([]);
  const [pv, setPv] = useState<Awaited<ReturnType<typeof previewMatches>> | null>(null);
  const [priceDollars, setPriceDollars] = useState("199");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [ms, p] = await Promise.all([
      list({ data: { campaign_id: campaignId } }),
      preview({ data: { campaign_id: campaignId } }),
    ]);
    setRows(ms as MatchRow[]);
    setPv(p);
  }, [list, preview, campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function doCommit() {
    const dollars = Number(priceDollars);
    if (!Number.isFinite(dollars) || dollars < 0 || dollars > 100_000) {
      toast.error("Annual price must be between $0 and $100,000");
      return;
    }
    setBusy(true);
    try {
      const res = await commit({
        data: {
          campaign_id: campaignId,
          annual_price_cents: Math.round(dollars * 100),
        },
      });
      toast.success(`Created ${res.inserted} matches · skipped ${res.skipped}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium">Matching preview</p>
            {pv ? (
              <p className="text-xs text-muted-foreground mt-1">
                {pv.totals.agents} agents · {pv.totals.lenders} lenders · already matched{" "}
                {pv.totals.already_matched} · proposed <strong>{pv.totals.proposed}</strong>{" "}
                · unmatchable {pv.totals.unmatchable}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Loading…</p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div>
              <Label htmlFor="price" className="text-xs">
                Annual price (USD)
              </Label>
              <Input
                id="price"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="w-28 h-9"
                inputMode="decimal"
              />
            </div>
            <Button size="sm" onClick={doCommit} disabled={busy || !pv || pv.totals.proposed === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              {busy ? "Committing…" : "Commit proposals"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Lender</th>
              <th className="text-left p-3">Agent view</th>
              <th className="text-left p-3">Lender view</th>
              <th className="text-left p-3">Price</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No matches yet. Preview above, then Commit.
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const status = m.status as SponsorshipMatchStatus;
              const disp = deriveOfferDisplay(status);
              // Related joined rows come in as arrays or single objects depending on shape.
              const agent = Array.isArray(m.sponsorship_agents)
                ? m.sponsorship_agents[0]
                : m.sponsorship_agents;
              const lender = Array.isArray(m.sponsorship_lenders)
                ? m.sponsorship_lenders[0]
                : m.sponsorship_lenders;
              return (
                <tr key={m.id} className="border-t align-top">
                  <td className="p-3 text-xs">
                    <div className="font-mono">{agent?.email ?? "—"}</div>
                    <div className="text-muted-foreground">
                      {[agent?.city, agent?.state, agent?.postal_code].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-mono">{lender?.email ?? "—"}</div>
                    <div className="text-muted-foreground">{lender?.company ?? ""}</div>
                  </td>
                  <td className="p-3 text-xs">
                    <Tone tone={disp.tone}>{disp.agentLabel}</Tone>
                  </td>
                  <td className="p-3 text-xs">
                    <Tone tone={disp.tone}>{disp.lenderLabel}</Tone>
                  </td>
                  <td className="p-3 text-xs">
                    ${(m.annual_price_cents / 100).toFixed(0)}
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={m.status}
                      onChange={async (e) => {
                        try {
                          await setMS({
                            data: {
                              id: m.id,
                              status: e.target.value as SponsorshipMatchStatus,
                            },
                          });
                          toast.success("Updated");
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed");
                        }
                      }}
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      aria-label="Change match status"
                    >
                      {ALL_MATCH_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const ALL_MATCH_STATUSES: SponsorshipMatchStatus[] = [
  "draft",
  "ready",
  "agent_invitation_pending",
  "agent_invited",
  "agent_viewed",
  "agent_accepted",
  "agent_declined",
  "lender_notification_pending",
  "lender_notified",
  "lender_viewed",
  "payment_pending",
  "paid",
  "active",
  "expired",
  "reassigned",
  "cancelled",
];

function Tone({
  tone,
  children,
}: {
  tone: "neutral" | "progress" | "success" | "failure";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "failure"
        ? "text-red-700 dark:text-red-400"
        : tone === "progress"
          ? "text-amber-700 dark:text-amber-400"
          : "text-muted-foreground";
  return <span className={cls}>{children}</span>;
}

// -----------------------------------------------------------------------
// Preview Tab (email templates — never sent)
// -----------------------------------------------------------------------
function PreviewTab({ campaignId }: { campaignId: string }) {
  const list = useServerFn(listMatches);
  const preview = useServerFn(previewMatchEmails);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renderedPreview, setRenderedPreview] = useState<Awaited<
    ReturnType<typeof previewMatchEmails>
  > | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    list({ data: { campaign_id: campaignId } }).then((r) => {
      const arr = r as MatchRow[];
      setRows(arr);
      if (arr.length > 0) setSelectedId(arr[0].id);
    });
  }, [list, campaignId]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    let active = true;
    setRenderedPreview(null);
    setPreviewError(null);
    if (!selected) return () => {
      active = false;
    };
    preview({ data: { campaign_id: campaignId, match_id: selected.id } })
      .then((r) => {
        if (active) setRenderedPreview(r as Awaited<ReturnType<typeof previewMatchEmails>>);
      })
      .catch((e) => {
        if (active) setPreviewError(e instanceof Error ? e.message : "Failed to render preview");
      });
    return () => {
      active = false;
    };
  }, [preview, campaignId, selected]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-medium flex items-center gap-2">
          <Send className="h-4 w-4" />
          Message previews (nothing is ever sent from this screen)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Phase 1 shows exactly what the agent and lender emails will look like once transactional
          delivery is wired up. No external integration is loaded.
        </p>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No matches yet — commit some matches first.
        </Card>
      ) : (
        <>
          <Card className="p-3">
            <Label className="text-xs">Match</Label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm mt-1"
            >
              {rows.map((r) => {
                const a = Array.isArray(r.sponsorship_agents)
                  ? r.sponsorship_agents[0]
                  : r.sponsorship_agents;
                const l = Array.isArray(r.sponsorship_lenders)
                  ? r.sponsorship_lenders[0]
                  : r.sponsorship_lenders;
                return (
                  <option key={r.id} value={r.id}>
                    {a?.email} → {l?.email}
                  </option>
                );
              })}
            </select>
          </Card>

          {previewError && <Card className="p-4 text-sm text-destructive">{previewError}</Card>}
          {!previewError && !renderedPreview && (
            <Card className="p-4 text-sm text-muted-foreground">Loading preview…</Card>
          )}
          {renderedPreview && (
            <div className="grid md:grid-cols-2 gap-3">
              <EmailCard title="Agent invitation" data={renderedPreview.agent} />
              <EmailCard title="Lender notification" data={renderedPreview.lender} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmailCard({
  title,
  data,
}: {
  title: string;
  data: { subject: string; cta: string; body: string };
}) {
  return (
    <Card className="p-4 space-y-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <div>
        <p className="text-[10px] uppercase text-muted-foreground">Subject</p>
        <p className="text-sm font-medium">{data.subject}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase text-muted-foreground">Body</p>
        <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/40 rounded p-3">
          {data.body}
        </pre>
      </div>
      <div>
        <p className="text-[10px] uppercase text-muted-foreground">Primary CTA</p>
        <Button size="sm" variant="outline" disabled>
          {data.cta}
        </Button>
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------
// Audit Tab
// -----------------------------------------------------------------------
function AuditTab({ campaignId }: { campaignId: string }) {
  const list = useServerFn(listAuditEvents);
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    list({ data: { campaign_id: campaignId } }).then((r) => setRows(r as AuditRow[]));
  }, [list, campaignId]);

  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="text-left p-3">When</th>
            <th className="text-left p-3">Event</th>
            <th className="text-left p-3">Actor</th>
            <th className="text-left p-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-muted-foreground">
                No audit events yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t align-top">
              <td className="p-3 text-xs font-mono">
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td className="p-3 text-xs">{r.event_type}</td>
              <td className="p-3 text-xs text-muted-foreground">
                {r.actor_type}
                {r.actor_user_id ? ` · ${r.actor_user_id.slice(0, 8)}…` : ""}
              </td>
              <td className="p-3 text-xs">
                <pre className="whitespace-pre-wrap font-mono text-[11px]">
                  {JSON.stringify(r.sanitized_metadata, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
