import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static configuration test. The public tour routes must configure React Query
 * with a refetchInterval strictly less than the 3600s server signing TTL.
 *
 * We assert on the source because loading the route module requires a Router
 * runtime; the configuration is what matters for correctness, and any
 * regression that removes/lengthens the interval is caught here.
 */
function readRoute(name: string) {
  return readFileSync(join(process.cwd(), "src/routes/_public", name), "utf8");
}

describe("public tour auto-refresh configuration", () => {
  for (const file of ["tour.$slug.tsx", "u.$slug.tsx"]) {
    describe(file, () => {
      const src = readRoute(file);
      it("declares a refetchInterval on the media query", () => {
        expect(src).toMatch(/refetchInterval\s*:\s*[^,]+/);
      });
      it("refetch interval is expressed as minutes < 60 (public TTL = 60 min)", () => {
        // Match `NN * 60 * 1000`
        const m = src.match(/refetchInterval\s*:\s*(\d+)\s*\*\s*60\s*\*\s*1000/);
        expect(m, "must use `<minutes> * 60 * 1000`").not.toBeNull();
        const minutes = Number(m![1]);
        expect(minutes).toBeGreaterThanOrEqual(30);
        expect(minutes).toBeLessThan(60);
      });
      it("does NOT refetch in background", () => {
        expect(src).toMatch(/refetchIntervalInBackground\s*:\s*false/);
      });
      it("has a positive staleTime shorter than the signing TTL", () => {
        const m = src.match(/staleTime\s*:\s*(\d+)\s*\*\s*60\s*\*\s*1000/);
        expect(m).not.toBeNull();
        const minutes = Number(m![1]);
        expect(minutes).toBeGreaterThan(0);
        expect(minutes).toBeLessThan(60);
      });
    });
  }
});
