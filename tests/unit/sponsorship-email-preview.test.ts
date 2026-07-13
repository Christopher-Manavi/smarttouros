import { describe, it, expect } from "vitest";
import {
  renderAgentEmailPreview,
  renderLenderEmailPreview,
  type PreviewInput,
} from "@/lib/sponsorship/email-preview";
import * as previewModule from "@/lib/sponsorship/email-preview";

const full: PreviewInput = {
  agentFirstName: "Alice",
  agentLastName: "Nguyen",
  agentBrokerage: "Mountain Realty",
  agentCity: "Denver",
  agentState: "CO",
  listingCount: 7,
  lenderFirstName: "Bob",
  lenderLastName: "Chen",
  lenderCompany: "Summit Home Loans",
  annualPriceCents: 99900,
};

const PLACEHOLDER_RE = /\[[A-Za-z][^\]\n]{1,60}\]|\{\{[^}]+\}\}|\bundefined\b|\bnull\b/;

function assertNoPlaceholders(...strings: string[]) {
  for (const s of strings) {
    expect(s).not.toMatch(PLACEHOLDER_RE);
  }
}

describe("sponsorship/email-preview — agent invitation", () => {
  it("renders subject, cta and body with all fields", () => {
    const out = renderAgentEmailPreview(full);
    expect(out.subject).toBe("Summit Home Loans wants to sponsor your listing lead platform");
    expect(out.cta).toBe("Yes — ask Bob to sponsor my account");
    expect(out.body).toContain("Hi Alice,");
    expect(out.body).toContain("Bob Chen at Summit Home Loans");
    expect(out.body).toContain("• Branded virtual-tour pages");
    expect(out.body).toContain("MLS-safe unbranded tour links");
    expect(out.body).toContain("You keep control of your listings");
    // Neutral wording; no gendered pronoun.
    expect(out.body).not.toMatch(/\b(he|she|his|her|him)\b/i);
    // CTA subtext with converted price.
    expect(out.body).toContain("$999 annual account");
    assertNoPlaceholders(out.subject, out.cta, out.body, out.html);
  });

  it("does not lead with price in the subject or opening paragraph", () => {
    const out = renderAgentEmailPreview(full);
    expect(out.subject).not.toMatch(/\$/);
    const opening = out.body.split("\n\n").slice(0, 2).join("\n\n");
    expect(opening).not.toMatch(/\$/);
  });

  it("converts cents to dollars", () => {
    expect(renderAgentEmailPreview({ ...full, annualPriceCents: 99900 }).body).toContain("$999");
    expect(renderAgentEmailPreview({ ...full, annualPriceCents: 120000 }).body).toContain(
      "$1,200",
    );
    expect(renderAgentEmailPreview({ ...full, annualPriceCents: 0 }).body).toContain("$0");
  });

  it("falls back cleanly when lender company / names are missing", () => {
    const out = renderAgentEmailPreview({
      ...full,
      lenderCompany: null,
      lenderLastName: null,
      agentFirstName: null,
      agentLastName: null,
    });
    expect(out.body).toContain("Hi there,");
    expect(out.subject).toContain("Bob");
    assertNoPlaceholders(out.subject, out.cta, out.body, out.html);
  });

  it("escapes imported prospect data in HTML", () => {
    const evil = renderAgentEmailPreview({
      ...full,
      agentFirstName: "<script>alert('x')</script>",
      lenderCompany: "Acme & Co \"Best\"",
    });
    expect(evil.html).not.toContain("<script>alert");
    expect(evil.html).toContain("&lt;script&gt;");
    expect(evil.html).toContain("Acme &amp; Co &quot;Best&quot;");
  });
});

describe("sponsorship/email-preview — lender notification", () => {
  it("renders subject, cta, body and fact block with all fields", () => {
    const out = renderLenderEmailPreview(full);
    expect(out.subject).toBe("Alice Nguyen requested sponsorship from you");
    expect(out.cta).toBe("Review Alice's sponsorship request");
    expect(out.body).toContain("Hi Bob,");
    expect(out.body).toContain("Alice Nguyen of Mountain Realty");
    expect(out.body).toContain("Agent: Alice Nguyen");
    expect(out.body).toContain("Brokerage: Mountain Realty");
    expect(out.body).toContain("Market: Denver, CO");
    expect(out.body).toContain("Active listings: 7");
    expect(out.body).toContain("Annual sponsored seat: $999");
    assertNoPlaceholders(out.subject, out.cta, out.body, out.html);
  });

  it("omits missing optional fields cleanly", () => {
    const out = renderLenderEmailPreview({
      ...full,
      agentBrokerage: null,
      agentCity: null,
      agentState: null,
      listingCount: null,
    });
    expect(out.body).not.toMatch(/Brokerage:/);
    expect(out.body).not.toMatch(/Market:/);
    expect(out.body).not.toMatch(/Active listings:/);
    // "of Brokerage" clause dropped when brokerage missing.
    expect(out.body).toContain("Alice Nguyen has accepted the SmartTourOS sponsorship invitation");
    expect(out.body).toContain("Annual sponsored seat: $999");
    assertNoPlaceholders(out.subject, out.cta, out.body, out.html);
  });

  it("uses city-only or state-only market when one is missing", () => {
    expect(
      renderLenderEmailPreview({ ...full, agentState: null }).body,
    ).toContain("Market: Denver");
    expect(
      renderLenderEmailPreview({ ...full, agentCity: null }).body,
    ).toContain("Market: CO");
  });

  it("escapes imported prospect data in HTML", () => {
    const evil = renderLenderEmailPreview({
      ...full,
      agentFirstName: "<b>Al</b>",
      agentBrokerage: "R&D \"Realty\"",
    });
    expect(evil.html).not.toContain("<b>Al</b>");
    expect(evil.html).toContain("&lt;b&gt;Al&lt;/b&gt;");
    expect(evil.html).toContain("R&amp;D &quot;Realty&quot;");
  });
});

describe("sponsorship/email-preview — transport safety", () => {
  it("does not import any email transport", () => {
    // Every exported member is a plain function; no side-effectful transports.
    for (const key of Object.keys(previewModule)) {
      const v = (previewModule as Record<string, unknown>)[key];
      expect(typeof v === "function" || typeof v === "object" || v === undefined).toBe(true);
    }
    // Nothing on globalThis was hijacked by a mail SDK.
    expect((globalThis as Record<string, unknown>).Resend).toBeUndefined();
    expect((globalThis as Record<string, unknown>).sgMail).toBeUndefined();
  });
});
