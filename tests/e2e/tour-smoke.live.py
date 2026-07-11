import asyncio, sys, json
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
ACTIVE = "707-mendocino-way-redwood-city-ca-79yyx"
NONEXISTENT = "totally-not-a-real-slug-zzz9999"

results = {"pass": [], "fail": []}

def rec(name, ok, detail=""):
    (results["pass"] if ok else results["fail"]).append(f"{name}{': ' + detail if detail else ''}")

async def load(page, url):
    signed = []
    def on_req(req):
        if "/storage/v1/object/sign/" in req.url:
            signed.append(req.url)
    page.on("request", on_req)
    resp = await page.goto(url, wait_until="networkidle")
    # extra settle time
    await page.wait_for_timeout(1500)
    return resp, signed

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width":1280,"height":1800})

        # --- 1. Branded active loads listing media ---
        page = await ctx.new_page()
        resp, signed = await load(page, f"{BASE}/tour/{ACTIVE}")
        lm = [u for u in signed if "/listing-media/" in u]
        rec("branded/active loads listing-media", len(lm) >= 1, f"{len(lm)} signed listing-media requests")
        # verify at least one signed URL returns 200 with bytes
        ok_bytes = False
        if lm:
            r = await ctx.request.get(lm[0])
            body = await r.body()
            ok_bytes = r.status == 200 and len(body) > 0
        rec("branded signed URL returns 200 + bytes", ok_bytes)
        await page.close()

        # --- 2. Unbranded active loads listing media, NO company-logos ---
        page = await ctx.new_page()
        _, signed = await load(page, f"{BASE}/u/{ACTIVE}")
        lm = [u for u in signed if "/listing-media/" in u]
        logos = [u for u in signed if "/company-logos/" in u]
        rec("unbranded loads listing-media", len(lm) >= 1, f"{len(lm)} listing-media")
        rec("unbranded NEVER signs company-logos", len(logos) == 0, f"logos={len(logos)}")
        # PII scan of body
        body_text = (await page.locator("body").inner_text()).lower()
        for term in ["brokerage","realtor"]:
            rec(f"unbranded body has no '{term}'", term not in body_text)
        await page.close()

        # --- 3. Nonexistent slug: no signed URLs, page renders empty state ---
        page = await ctx.new_page()
        resp, signed = await load(page, f"{BASE}/tour/{NONEXISTENT}")
        rec("nonexistent slug: no signed URLs", len(signed) == 0, f"signed={len(signed)}")
        rec("nonexistent slug: server does not 5xx", resp is None or resp.status < 500, f"status={resp.status if resp else 'n/a'}")
        await page.close()

        await b.close()

    print(json.dumps(results, indent=2))
    sys.exit(0 if not results["fail"] else 1)

asyncio.run(main())
