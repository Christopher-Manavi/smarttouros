/**
 * Deterministic, reviewable matching logic for Sponsorship Engine Phase 1.
 * Pure function over agent + lender arrays; no AI, no external calls.
 * The DB partial unique index and lender max_current_sponsorships are the
 * authoritative backstops — this function preflights and orders proposals.
 */

export type MatchAgent = {
  id: string;
  email: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

export type MatchLender = {
  id: string;
  email: string;
  city: string | null;
  state: string | null;
  service_zip_codes: string[];
  max_current_sponsorships: number;
  current_load: number; // count of non-terminal matches (from caller)
};

export type Proposal = {
  agent_id: string;
  lender_id: string;
  rank_reason: "postal_overlap" | "same_city" | "same_state" | "fallback";
};

/**
 * Rank lenders for one agent using the deterministic tier order:
 *   1. postal-code / service-ZIP overlap
 *   2. same city (case-insensitive)
 *   3. same state
 *   4. fallback (any lender still under capacity)
 * Ties broken by (current_load ASC, email ASC) for reproducibility.
 */
export function rankLendersForAgent(
  agent: MatchAgent,
  lenders: MatchLender[],
): { lender: MatchLender; reason: Proposal["rank_reason"] }[] {
  const eligible = lenders.filter((l) => l.current_load < l.max_current_sponsorships);
  const scored = eligible.map((l) => {
    let reason: Proposal["rank_reason"] = "fallback";
    if (agent.postal_code && l.service_zip_codes.includes(agent.postal_code)) {
      reason = "postal_overlap";
    } else if (agent.city && l.city && agent.city.trim().toLowerCase() === l.city.trim().toLowerCase()) {
      reason = "same_city";
    } else if (agent.state && l.state && agent.state.trim().toLowerCase() === l.state.trim().toLowerCase()) {
      reason = "same_state";
    }
    return { lender: l, reason };
  });

  const tierRank: Record<Proposal["rank_reason"], number> = {
    postal_overlap: 0,
    same_city: 1,
    same_state: 2,
    fallback: 3,
  };

  return scored.sort((a, b) => {
    if (tierRank[a.reason] !== tierRank[b.reason]) return tierRank[a.reason] - tierRank[b.reason];
    if (a.lender.current_load !== b.lender.current_load) return a.lender.current_load - b.lender.current_load;
    return a.lender.email.localeCompare(b.lender.email);
  });
}

/**
 * Propose one lender per agent. Idempotent given the same inputs.
 * `alreadyMatchedAgentIds` are skipped (they still have a non-terminal match).
 * Lender load is updated locally as proposals are made so capacity holds
 * across the batch.
 */
export function proposeMatches(
  agents: MatchAgent[],
  lenders: MatchLender[],
  alreadyMatchedAgentIds: Set<string>,
): Proposal[] {
  const workingLenders = lenders.map((l) => ({ ...l }));
  const proposals: Proposal[] = [];

  const sortedAgents = [...agents].sort((a, b) => a.email.localeCompare(b.email));

  for (const agent of sortedAgents) {
    if (alreadyMatchedAgentIds.has(agent.id)) continue;
    const ranked = rankLendersForAgent(agent, workingLenders);
    const pick = ranked[0];
    if (!pick) continue;
    proposals.push({ agent_id: agent.id, lender_id: pick.lender.id, rank_reason: pick.reason });
    pick.lender.current_load += 1;
  }

  return proposals;
}
