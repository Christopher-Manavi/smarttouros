import {
  renderAgentEmailPreview,
  renderLenderEmailPreview,
  type PreviewInput,
} from "./email-preview";

type Relation<T> = T | T[] | null | undefined;

export type PreviewMatchSource = {
  annual_price_cents: number | null;
  sponsorship_agents?: Relation<{
    first_name: string | null;
    last_name: string | null;
    brokerage?: string | null;
    city?: string | null;
    state?: string | null;
    listing_count?: number | null;
  }>;
  sponsorship_lenders?: Relation<{
    first_name: string | null;
    last_name?: string | null;
    company: string | null;
  }>;
};

function firstRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

export function toPreviewInputFromMatch(match: PreviewMatchSource): PreviewInput {
  const agent = firstRelation(match.sponsorship_agents);
  const lender = firstRelation(match.sponsorship_lenders);
  const listingCount = agent?.listing_count;

  return {
    agentFirstName: agent?.first_name ?? null,
    agentLastName: agent?.last_name ?? null,
    agentCity: agent?.city ?? null,
    agentState: agent?.state ?? null,
    agentBrokerage: agent?.brokerage ?? null,
    listingCount:
      typeof listingCount === "number" && Number.isFinite(listingCount) ? listingCount : null,
    lenderFirstName: lender?.first_name ?? null,
    lenderLastName: lender?.last_name ?? null,
    lenderCompany: lender?.company ?? null,
    annualPriceCents:
      typeof match.annual_price_cents === "number" && Number.isFinite(match.annual_price_cents)
        ? match.annual_price_cents
        : 0,
  };
}

export function renderMatchEmailPreviews(match: PreviewMatchSource) {
  const input = toPreviewInputFromMatch(match);
  return {
    input,
    agent: renderAgentEmailPreview(input),
    lender: renderLenderEmailPreview(input),
  };
}