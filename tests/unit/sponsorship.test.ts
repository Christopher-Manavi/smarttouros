import { describe, it, expect } from "vitest";
import { proposeMatches, rankLendersForAgent, type MatchAgent, type MatchLender } from "@/lib/sponsorship/matching";
import {
  parseCsv,
  validateAgents,
  validateLenders,
} from "@/lib/sponsorship/csv";
import { deriveOfferDisplay, isTerminal, isCurrent } from "@/lib/sponsorship/status";
import {
  normalizeEmail,
  normalizeZip,
  normalizeZipList,
  isValidEmail,
  isValidNmls,
} from "@/lib/sponsorship/normalize";

describe("sponsorship/normalize", () => {
  it("lowercases and trims emails", () => {
    expect(normalizeEmail("  ALICE@Example.COM ")).toBe("alice@example.com");
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
  it("validates email shape", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
  it("validates NMLS numbers", () => {
    expect(isValidNmls(null)).toBe(true);
    expect(isValidNmls("")).toBe(true);
    expect(isValidNmls("123456")).toBe(true);
    expect(isValidNmls("abc123")).toBe(false);
    expect(isValidNmls("1234")).toBe(false);
  });
  it("normalizes ZIP codes and deduplicates lists", () => {
    expect(normalizeZip("80202")).toBe("80202");
    expect(normalizeZip("802")).toBeNull();
    expect(normalizeZipList("80202, 80203 80202,,")).toEqual(["80202", "80203"]);
    expect(normalizeZipList(["80202", "junk", "80204"])).toEqual(["80202", "80204"]);
  });
});

describe("sponsorship/csv", () => {
  it("parses CSV with header and skips blank rows", () => {
    const rows = parseCsv("email,first_name\n a@b.co ,Alice\n\nc@d.co,Bob\n");
    expect(rows).toHaveLength(2);
    expect(rows[0].email).toBe("a@b.co");
    expect(rows[1].first_name).toBe("Bob");
  });
  it("validateAgents rejects bad emails and duplicates", () => {
    const rows = parseCsv(
      "email,first_name\nalice@example.com,Alice\nnope,Bad\nALICE@EXAMPLE.COM,Dup\n",
    );
    const res = validateAgents(rows);
    expect(res.valid).toHaveLength(1);
    expect(res.errors.length).toBeGreaterThanOrEqual(1);
    expect(res.duplicates).toHaveLength(1);
  });
  it("validateLenders handles service_zip_codes", () => {
    const rows = parseCsv(
      "email,company,service_zip_codes\nl@x.co,Anywhere,80202 80203 80202\n",
    );
    const res = validateLenders(rows);
    expect(res.valid[0].service_zip_codes).toEqual(["80202", "80203"]);
  });
});

describe("sponsorship/status", () => {
  it("classifies terminal vs current", () => {
    expect(isTerminal("agent_declined")).toBe(true);
    expect(isCurrent("agent_invited")).toBe(true);
    expect(isTerminal("active")).toBe(false);
  });
  it("derives display labels", () => {
    expect(deriveOfferDisplay("active").tone).toBe("success");
    expect(deriveOfferDisplay("agent_declined").tone).toBe("failure");
    expect(deriveOfferDisplay("agent_invited").agentLabel).toMatch(/Invited/);
  });
});

describe("sponsorship/matching", () => {
  const agents: MatchAgent[] = [
    { id: "a1", email: "a1@x.co", city: "Denver", state: "CO", postal_code: "80202" },
    { id: "a2", email: "a2@x.co", city: "Boulder", state: "CO", postal_code: "80301" },
    { id: "a3", email: "a3@x.co", city: "Elsewhere", state: "CO", postal_code: null },
  ];
  const lenders: MatchLender[] = [
    {
      id: "L_zip",
      email: "zip@x.co",
      city: "Somewhere",
      state: "CO",
      service_zip_codes: ["80202"],
      max_current_sponsorships: 5,
      current_load: 0,
    },
    {
      id: "L_city",
      email: "city@x.co",
      city: "Boulder",
      state: "CO",
      service_zip_codes: [],
      max_current_sponsorships: 5,
      current_load: 0,
    },
    {
      id: "L_state",
      email: "state@x.co",
      city: "Nowhere",
      state: "CO",
      service_zip_codes: [],
      max_current_sponsorships: 1,
      current_load: 0,
    },
  ];

  it("prefers ZIP overlap, then city, then state", () => {
    expect(rankLendersForAgent(agents[0], lenders)[0].reason).toBe("postal_overlap");
    expect(rankLendersForAgent(agents[1], lenders)[0].reason).toBe("same_city");
    expect(rankLendersForAgent(agents[2], lenders)[0].reason).toBe("same_state");
  });

  it("respects lender capacity", () => {
    const capped = lenders.map((l) =>
      l.id === "L_state" ? { ...l, current_load: 1 } : l,
    );
    const ranked = rankLendersForAgent(agents[2], capped);
    expect(ranked.find((r) => r.lender.id === "L_state")).toBeUndefined();
  });

  it("proposeMatches skips already-matched agents and updates load across the batch", () => {
    const already = new Set(["a1"]);
    const proposals = proposeMatches(agents, lenders, already);
    // a1 skipped, a2 → L_city (same_city), a3 → L_state (only state match with capacity)
    expect(proposals).toHaveLength(2);
    expect(proposals.find((p) => p.agent_id === "a1")).toBeUndefined();
    expect(proposals.find((p) => p.agent_id === "a2")?.lender_id).toBe("L_city");
    // After L_state is picked once, its capacity is 1 so no more use is possible.
    expect(proposals.find((p) => p.agent_id === "a3")?.lender_id).toBe("L_state");
  });

  it("is deterministic across runs", () => {
    const p1 = proposeMatches(agents, lenders, new Set());
    const p2 = proposeMatches(agents, lenders, new Set());
    expect(p1).toEqual(p2);
  });
});
