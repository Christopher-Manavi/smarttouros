/**
 * Phase 1 email previews. Rendered strings only — never sent.
 * Explicitly no import of Resend, SendGrid, SMTP, or any transport.
 */

export type PreviewInput = {
  agentFirstName: string | null;
  agentLastName: string | null;
  lenderFirstName: string | null;
  lenderCompany: string | null;
  annualPriceCents: number;
};

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function agentDisplayName(i: PreviewInput): string {
  const parts = [i.agentFirstName, i.agentLastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "the agent";
}

export function renderAgentEmailPreview(i: PreviewInput): {
  subject: string;
  cta: string;
  body: string;
} {
  const company = i.lenderCompany ?? "your local lender";
  const lender = i.lenderFirstName ?? "your lender";
  const subject = `Would you like ${company} to sponsor your SmartTourOS account?`;
  const cta = `Yes — ask ${lender} to sponsor me`;
  const body = [
    `Hi ${i.agentFirstName ?? "there"},`,
    "",
    `${company} would like to sponsor your annual SmartTourOS account (${fmtPrice(
      i.annualPriceCents,
    )}/yr).`,
    "",
    "If you accept, we'll ask them to activate your seat. You never pay.",
    "",
    "— SmartTourOS",
  ].join("\n");
  return { subject, cta, body };
}

export function renderLenderEmailPreview(i: PreviewInput): {
  subject: string;
  cta: string;
  body: string;
} {
  const agent = agentDisplayName(i);
  const agentFirst = i.agentFirstName ?? "the agent";
  const subject = `${agent} requested you as their SmartTourOS lender sponsor`;
  const cta = `Review ${agentFirst}'s sponsorship request`;
  const body = [
    `Hi ${i.lenderFirstName ?? "there"},`,
    "",
    `${agent} has accepted your sponsorship offer for SmartTourOS.`,
    `Annual sponsored seat: ${fmtPrice(i.annualPriceCents)}.`,
    "",
    "Review their profile and activate the seat when ready.",
    "",
    "— SmartTourOS",
  ].join("\n");
  return { subject, cta, body };
}
