/**
 * Single canonical workflow status derivation for sponsorship_matches.
 * `sponsorship_matches.status` is the sole source of truth; agent- and
 * lender-facing display states are DERIVED here, never stored independently.
 */

export type SponsorshipMatchStatus =
  | "draft"
  | "ready"
  | "agent_invitation_pending"
  | "agent_invited"
  | "agent_viewed"
  | "agent_accepted"
  | "agent_declined"
  | "lender_notification_pending"
  | "lender_notified"
  | "lender_viewed"
  | "payment_pending"
  | "paid"
  | "active"
  | "expired"
  | "reassigned"
  | "cancelled";

export const NON_TERMINAL_STATUSES: readonly SponsorshipMatchStatus[] = [
  "draft",
  "ready",
  "agent_invitation_pending",
  "agent_invited",
  "agent_viewed",
  "agent_accepted",
  "lender_notification_pending",
  "lender_notified",
  "lender_viewed",
  "payment_pending",
  "paid",
  "active",
];

export const TERMINAL_STATUSES: readonly SponsorshipMatchStatus[] = [
  "agent_declined",
  "expired",
  "reassigned",
  "cancelled",
];

export function isTerminal(s: SponsorshipMatchStatus): boolean {
  return TERMINAL_STATUSES.includes(s);
}

export function isCurrent(s: SponsorshipMatchStatus): boolean {
  return NON_TERMINAL_STATUSES.includes(s);
}

export type OfferDisplay = {
  agentLabel: string;
  lenderLabel: string;
  tone: "neutral" | "progress" | "success" | "failure";
};

export function deriveOfferDisplay(status: SponsorshipMatchStatus): OfferDisplay {
  switch (status) {
    case "draft":
      return { agentLabel: "Not yet queued", lenderLabel: "Not yet queued", tone: "neutral" };
    case "ready":
      return { agentLabel: "Ready to invite", lenderLabel: "Awaiting agent", tone: "neutral" };
    case "agent_invitation_pending":
      return { agentLabel: "Invitation queued", lenderLabel: "Awaiting agent", tone: "progress" };
    case "agent_invited":
      return { agentLabel: "Invited", lenderLabel: "Awaiting agent", tone: "progress" };
    case "agent_viewed":
      return { agentLabel: "Viewed offer", lenderLabel: "Awaiting agent", tone: "progress" };
    case "agent_accepted":
      return { agentLabel: "Accepted", lenderLabel: "Awaiting notification", tone: "progress" };
    case "agent_declined":
      return { agentLabel: "Declined", lenderLabel: "Not notified", tone: "failure" };
    case "lender_notification_pending":
      return { agentLabel: "Accepted", lenderLabel: "Notification queued", tone: "progress" };
    case "lender_notified":
      return { agentLabel: "Accepted", lenderLabel: "Notified", tone: "progress" };
    case "lender_viewed":
      return { agentLabel: "Accepted", lenderLabel: "Viewed request", tone: "progress" };
    case "payment_pending":
      return { agentLabel: "Accepted", lenderLabel: "Payment pending", tone: "progress" };
    case "paid":
      return { agentLabel: "Sponsored", lenderLabel: "Paid", tone: "success" };
    case "active":
      return { agentLabel: "Sponsored", lenderLabel: "Active", tone: "success" };
    case "expired":
      return { agentLabel: "Expired", lenderLabel: "Expired", tone: "failure" };
    case "reassigned":
      return { agentLabel: "Reassigned", lenderLabel: "Reassigned", tone: "neutral" };
    case "cancelled":
      return { agentLabel: "Cancelled", lenderLabel: "Cancelled", tone: "failure" };
  }
}
