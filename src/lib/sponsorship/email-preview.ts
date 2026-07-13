/**
 * Phase 1 message previews. Rendered strings only — never sent.
 * Explicitly no import of Resend, SendGrid, SMTP, or any transport.
 *
 * Templates return both a plain-text body and an HTML-safe body. All
 * imported prospect data is escaped before rendering HTML. Missing optional
 * fields are omitted cleanly rather than producing "undefined" or blank lines.
 */

export type PreviewInput = {
  agentFirstName: string | null;
  agentLastName: string | null;
  agentBrokerage?: string | null;
  agentCity?: string | null;
  agentState?: string | null;
  listingCount?: number | null;
  lenderFirstName: string | null;
  lenderLastName?: string | null;
  lenderCompany: string | null;
  annualPriceCents: number;
};

export type RenderedEmail = {
  subject: string;
  cta: string;
  body: string;
  html: string;
};

function fmtPrice(cents: number): string {
  const dollars = Math.max(0, Math.round(cents / 100));
  return `$${dollars.toLocaleString("en-US")}`;
}

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length ? t : null;
}

function agentFullName(i: PreviewInput): string | null {
  const parts = [clean(i.agentFirstName), clean(i.agentLastName)].filter(
    (x): x is string => !!x,
  );
  return parts.length ? parts.join(" ") : null;
}

function lenderFullName(i: PreviewInput): string | null {
  const parts = [clean(i.lenderFirstName), clean(i.lenderLastName)].filter(
    (x): x is string => !!x,
  );
  return parts.length ? parts.join(" ") : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text: string): string {
  // Convert already-escaped plain text (with • bullets and blank lines) into
  // simple mobile-readable HTML paragraphs.
  const blocks = text.split(/\n{2,}/);
  const html = blocks
    .map((block) => {
      const lines = block.split("\n");
      const isList = lines.every((l) => l.trim().startsWith("• "));
      if (isList && lines.length > 1) {
        const items = lines
          .map((l) => `<li style="margin:4px 0">${l.replace(/^•\s+/, "")}</li>`)
          .join("");
        return `<ul style="padding-left:20px;margin:0 0 12px">${items}</ul>`;
      }
      return `<p style="margin:0 0 12px;line-height:1.5">${lines.join("<br />")}</p>`;
    })
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;max-width:560px">${html}</div>`;
}

// ---------------------------------------------------------------------------
// Agent invitation
// ---------------------------------------------------------------------------

export function renderAgentEmailPreview(i: PreviewInput): RenderedEmail {
  const lenderCompany = clean(i.lenderCompany);
  const lenderFirst = clean(i.lenderFirstName);
  const lenderFull = lenderFullName(i);
  const agentFirst = clean(i.agentFirstName);
  const price = fmtPrice(i.annualPriceCents);

  const companyForSubject = lenderCompany ?? lenderFull ?? lenderFirst ?? "A local lender";
  const subject = `Would you like ${companyForSubject} to sponsor your listing lead platform?`;

  const sponsorRef = lenderFull
    ? lenderCompany
      ? `${lenderFull} at ${lenderCompany}`
      : lenderFull
    : lenderCompany ?? "A local lender";
  const sponsorFirstRef = lenderFirst ?? "Your sponsor";
  // Gender-neutral wording is used unconditionally — we never require or infer gender.
  const pronounClause = "they";

  const greetingLine = `Hi ${agentFirst ?? "there"},`;
  const introLine = `${sponsorRef} would like to sponsor your SmartTourOS account for a full year — at no cost to you.`;
  const listIntro = "SmartTourOS gives you:";
  const bullets = [
    "• Branded virtual-tour pages for your marketing",
    "• MLS-safe unbranded tour links",
    "• Detailed analytics on buyers engaging with your listings",
    "• Technology designed to turn listing traffic into an actionable buyer pipeline",
  ].join("\n");
  const offerLine = `${sponsorFirstRef} will cover the full annual cost of your account. In return, ${pronounClause} would like the opportunity to co-work financing-ready buyer leads generated through your listings.`;
  const controlLine = "You keep control of your listings and buyer relationships.";

  const body = [
    greetingLine,
    "",
    introLine,
    "",
    listIntro,
    "",
    bullets,
    "",
    offerLine,
    "",
    controlLine,
  ].join("\n");

  const cta = `Yes — ask ${sponsorFirstRef} to sponsor my account`;
  const ctaSubtext = `A ${price} annual account, fully paid by your sponsor.`;

  const bodyEscaped = escapeHtml(body);
  const html = [
    textToHtml(bodyEscaped),
    `<p style="margin:16px 0 8px"><a href="#" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(
      cta,
    )}</a></p>`,
    `<p style="margin:0;font-size:12px;color:#666">${escapeHtml(ctaSubtext)}</p>`,
  ].join("");

  return { subject, cta, body: `${body}\n\n${ctaSubtext}`, html };
}

// ---------------------------------------------------------------------------
// Lender notification
// ---------------------------------------------------------------------------

export function renderLenderEmailPreview(i: PreviewInput): RenderedEmail {
  const agentFull = agentFullName(i);
  const agentFirst = clean(i.agentFirstName);
  const brokerage = clean(i.agentBrokerage);
  const city = clean(i.agentCity);
  const state = clean(i.agentState);
  const listingCount =
    typeof i.listingCount === "number" && Number.isFinite(i.listingCount) && i.listingCount >= 0
      ? Math.floor(i.listingCount)
      : null;
  const lenderFirst = clean(i.lenderFirstName);
  const price = fmtPrice(i.annualPriceCents);

  const agentRefFull = agentFull ?? "An agent";
  const agentRefFirst = agentFirst ?? agentFull ?? "the agent";
  const subject = `${agentRefFull} requested sponsorship from you`;

  const greetingLine = `Hi ${lenderFirst ?? "there"},`;
  const openerLine = brokerage
    ? `${agentRefFull} of ${brokerage} has accepted the SmartTourOS sponsorship invitation and selected you as their lender partner.`
    : `${agentRefFull} has accepted the SmartTourOS sponsorship invitation and selected you as their lender partner.`;
  const productLine = `SmartTourOS helps ${agentRefFirst} turn traffic from active listings into an organized buyer pipeline using branded and MLS-safe property tours, visitor analytics and buyer-identification technology.`;
  const valueLine = `By activating ${agentRefFirst}'s annual sponsorship, you become their SmartTourOS lender sponsor and receive the opportunity to co-work financing-ready buyer leads generated through their listings.`;

  const marketParts = [city, state].filter((x): x is string => !!x);
  const factLines: string[] = [];
  factLines.push(`Agent: ${agentRefFull}`);
  if (brokerage) factLines.push(`Brokerage: ${brokerage}`);
  if (marketParts.length) factLines.push(`Market: ${marketParts.join(", ")}`);
  if (listingCount !== null) factLines.push(`Active listings: ${listingCount}`);
  factLines.push(`Annual sponsored seat: ${price}`);

  const body = [
    greetingLine,
    "",
    openerLine,
    "",
    productLine,
    "",
    valueLine,
    "",
    factLines.join("\n"),
  ].join("\n");

  const cta = `Review ${agentRefFirst}'s sponsorship request`;

  const bodyEscaped = escapeHtml(body);
  const html = [
    textToHtml(bodyEscaped),
    `<p style="margin:16px 0 0"><a href="#" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(
      cta,
    )}</a></p>`,
  ].join("");

  return { subject, cta, body, html };
}
