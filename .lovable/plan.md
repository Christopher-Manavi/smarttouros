## Security Hardening Pass 1 — Server-Side Data Minimization

**Migration already applied** — the following are already live in the database:
- `get_public_branded_tour(text)` — explicit allowlist for listing + company + tracking + privacy (privacy limited to `privacy_policy_url`, `terms_url`, `show_privacy_notice`, `privacy_notice_text`).
- `get_public_unbranded_tour(text)` — omits `agent_*`, `brokerage_*`, `company_id`; company returned as `NULL`; address/city/state/zip only included when `show_address_on_unbranded = true`.
- `record_public_event(...)` — SECURITY DEFINER, derives `listing_id`/`company_id` from slug, validates enums.
- All three functions: `REVOKE ALL ... FROM PUBLIC` then `GRANT EXECUTE ... TO anon, authenticated`.
- Old `get_public_tour` dropped.
- Policy `"anon read active listings"` on `public.listings` dropped; `REVOKE SELECT ON public.listings FROM anon`.
- Anon and authenticated event INSERT policies dropped; `REVOKE INSERT ON public.events FROM anon, authenticated`.

The linter's 8 WARNs are expected: these RPCs are intentionally public and are the only public-tour surface. No action required on them.

### Remaining client-side changes

1. **`src/components/tour-view.tsx`**
   - Replace `supabase.from("events").insert(...)` with `supabase.rpc("record_public_event", { p_slug, p_page_type, p_event_type, ... })`.
   - Change `recordEvent` signature: take `slug` + `pageType` + `eventType` (drop `listingId`/`companyId`).
   - Update all call sites in the file to pass `listing.slug` (both RPCs already return `slug`).
   - `loadTourBundle(slug, mode)` — dispatch to `get_public_branded_tour` or `get_public_unbranded_tour` based on `mode`.

2. **`src/routes/_public/tour.$slug.tsx`** — call `loadTourBundle(slug, "branded")`.

3. **`src/routes/_public/u.$slug.tsx`** — call `loadTourBundle(slug, "unbranded")`; remove the client-side hard-strip sanitizer (server now guarantees).

4. **`src/components/public-access-panel.tsx`** — the anonymous listing SELECT probe will now correctly fail. Relabel the checks to reflect the hardened contract: anon SELECT on `listings` MUST fail (that's the pass condition); direct anon INSERT on `events` MUST fail; anon call to `record_public_event` MUST succeed. Update the fetch probes accordingly.

5. **`src/routes/_authenticated/test-center.tsx`** — same reframing:
   - `anon_select` on `listings` → expected DENY (pass = HTTP 401/permission error).
   - `anon_insert` on `events` → expected DENY.
   - Add a new probe: anon RPC `record_public_event` → expected ALLOW, followed by verifying the event count increments.

### Verification after code changes
- `bun run tsc` clean.
- Fetch `/u/:demo-slug` with Playwright; assert JSON response body contains none of `agent_name`, `agent_phone`, `agent_email`, `brokerage_name`, `brokerage_logo_url`, `company_id`, and (when `show_address_on_unbranded=false`) none of `address`/`city`/`state`/`zip`; assert `company: null`.
- Fetch `/tour/:demo-slug`; assert branding fields present.
- Confirm a page_view row lands in `events` after visiting each URL.
- Confirm authenticated dashboard/listings pages still work (untouched policies).

### Change log deliverable
After the code edits, provide:
- Files changed.
- Security-focused summary tying each of the 9 acceptance criteria to the change that fulfills it.
