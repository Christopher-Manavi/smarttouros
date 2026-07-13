import { describe, expect, it } from "vitest";
import { renderMatchEmailPreviews } from "@/lib/sponsorship/email-preview-path";

describe("sponsorship production preview path", () => {
  it("renders the selected Houston match through match → relations → canonical templates", () => {
    const out = renderMatchEmailPreviews({
      annual_price_cents: 99900,
      sponsorship_agents: [
        {
          first_name: "Sarah",
          last_name: "Johnson",
          brokerage: "Test Realty",
          city: "Houston",
          state: "TX",
          listing_count: 5,
        },
      ],
      sponsorship_lenders: [
        {
          first_name: "John",
          last_name: "Smith",
          company: "Test Mortgage",
        },
      ],
    });

    expect(out.agent.subject).toBe(
      "Would you like Test Mortgage to sponsor your listing lead platform?",
    );
    expect(out.agent.subject).not.toBe("Test Mortgage wants to sponsor your listing lead platform");
    expect(out.input.agentBrokerage).toBe("Test Realty");
    expect(out.input.listingCount).toBe(5);
    expect(out.lender.body).toContain("Agent: Sarah Johnson");
    expect(out.lender.body).toContain("Brokerage: Test Realty");
    expect(out.lender.body).toContain("Market: Houston, TX");
    expect(out.lender.body).toContain("Active listings: 5");
    expect(out.lender.body).toContain("Annual sponsored seat: $999");
  });

  it("keeps listing_count 0 on the production mapping path", () => {
    const out = renderMatchEmailPreviews({
      annual_price_cents: 99900,
      sponsorship_agents: {
        first_name: "Sarah",
        last_name: "Johnson",
        brokerage: "Test Realty",
        city: "Houston",
        state: "TX",
        listing_count: 0,
      },
      sponsorship_lenders: {
        first_name: "John",
        last_name: "Smith",
        company: "Test Mortgage",
      },
    });

    expect(out.input.listingCount).toBe(0);
    expect(out.lender.body).toContain("Active listings: 0");
  });

  it("omits optional production-path fields cleanly when absent", () => {
    const out = renderMatchEmailPreviews({
      annual_price_cents: 99900,
      sponsorship_agents: {
        first_name: "Sarah",
        last_name: "Johnson",
        brokerage: null,
        city: "Houston",
        state: "TX",
        listing_count: null,
      },
      sponsorship_lenders: {
        first_name: "John",
        last_name: "Smith",
        company: "Test Mortgage",
      },
    });

    expect(out.lender.body).not.toMatch(/Brokerage:/);
    expect(out.lender.body).not.toMatch(/Active listings:/);
    expect(out.lender.body).not.toMatch(/\bundefined\b|\bnull\b/);
  });
});