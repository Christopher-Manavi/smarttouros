import { describe, it, expect } from "vitest";
import { __TESTING__ } from "@/lib/storage-preview";

describe("draft-preview auto refresh configuration", () => {
  it("TTL is 900 seconds (15 minutes)", () => {
    expect(__TESTING__.DRAFT_PREVIEW_TTL_SECONDS).toBe(900);
  });
  it("refetch interval is ~12 minutes, and strictly less than the TTL", () => {
    const refetchMs = __TESTING__.DRAFT_PREVIEW_REFETCH_MS;
    const ttlMs = __TESTING__.DRAFT_PREVIEW_TTL_SECONDS * 1000;
    // ~12 minutes
    expect(refetchMs).toBe(12 * 60 * 1000);
    // Must refresh BEFORE expiry, with margin.
    expect(refetchMs).toBeLessThan(ttlMs);
    expect(ttlMs - refetchMs).toBeGreaterThanOrEqual(60 * 1000);
  });
});
