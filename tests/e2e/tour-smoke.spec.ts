import { test, expect, type Page, type Request } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:8080";
const ACTIVE_SLUG = process.env.SMOKE_SLUG || "707-mendocino-way-redwood-city-ca-79yyx";
const NONEXISTENT_SLUG = "totally-not-a-real-slug-zzz9999";

/** Wait until at least one `/storage/v1/object/sign/` GET response completes. */
async function waitForSignedMedia(page: Page, timeout = 20_000): Promise<string> {
  const response = await page.waitForResponse(
    (r) => r.url().includes("/storage/v1/object/sign/") && r.request().method() === "GET",
    { timeout },
  );
  expect(response.status(), `signed URL fetch must return 200 (got ${response.status()})`).toBe(200);
  const buf = await response.body();
  expect(buf.byteLength).toBeGreaterThan(0);
  return response.url();
}

async function collectSignedRequests(page: Page): Promise<string[]> {
  const urls: string[] = [];
  page.on("request", (req: Request) => {
    const u = req.url();
    if (u.includes("/storage/v1/object/sign/")) urls.push(u);
  });
  return urls;
}

test.describe("public tour smoke", () => {
  test("branded active tour loads property media (200, nonzero bytes)", async ({ page }) => {
    await page.goto(`${BASE}/tour/${ACTIVE_SLUG}`, { waitUntil: "networkidle" });
    // At least one signed listing-media object must have been fetched successfully.
    const url = await waitForSignedMedia(page);
    expect(url).toContain("/listing-media/");
  });

  test("unbranded active tour loads property media (200, nonzero bytes)", async ({ page }) => {
    await page.goto(`${BASE}/u/${ACTIVE_SLUG}`, { waitUntil: "networkidle" });
    const url = await waitForSignedMedia(page);
    expect(url).toContain("/listing-media/");
  });

  test("unbranded page requests NO branding media and exposes no agent/broker PII", async ({
    page,
  }) => {
    const signedUrls = await collectSignedRequests(page);
    await page.goto(`${BASE}/u/${ACTIVE_SLUG}`, { waitUntil: "networkidle" });
    // Wait one more tick so late-fired requests settle.
    await page.waitForTimeout(1500);

    // No request may target the company-logos bucket on the unbranded page.
    const brandingHits = signedUrls.filter((u) => u.includes("/company-logos/"));
    expect(brandingHits, "unbranded route must never sign company-logos").toEqual([]);

    // PII scan against the rendered DOM.
    const bodyText = await page.locator("body").innerText();
    // The meta description on this route contains the literal phrase
    // "No agent or brokerage branding." — that's about the absence of PII,
    // not PII itself, and is NOT rendered inside <body>.
    expect(bodyText).not.toMatch(/agent(:|)\s+/i);
    expect(bodyText.toLowerCase()).not.toContain("brokerage");
    expect(bodyText.toLowerCase()).not.toContain("realtor");
    expect(bodyText.toLowerCase()).not.toContain("broker");
  });

  test("inactive / nonexistent slug returns generic empty behavior", async ({ page }) => {
    const signedUrls = await collectSignedRequests(page);
    const res = await page.goto(`${BASE}/tour/${NONEXISTENT_SLUG}`, {
      waitUntil: "domcontentloaded",
    });
    // Route resolves (SPA route match), server RPCs return null, no signed URL
    // ever hits `/storage/v1/object/sign/`.
    expect(res && res.status()).toBeLessThan(500);
    await page.waitForTimeout(2000);
    expect(signedUrls, "no media may be signed for a nonexistent slug").toEqual([]);
    // Page must show a "not found" / empty state — not throw.
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
