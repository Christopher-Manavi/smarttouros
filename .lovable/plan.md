# SmartTourOS MVP Build Plan

A white-label smart real estate tour platform. Luxury aesthetic (white/black/slate/soft gray, elegant serif headings + clean sans body, generous whitespace).

## Phase 1 — Backend (Lovable Cloud / Supabase)

Enable Lovable Cloud, then create schema via migration:

**Tables**
- `companies` — name, logo_url, brand_color, phone, email, custom_domain_placeholder
- `profiles` — user_id, full_name, company_id (role lives in `user_roles`)
- `user_roles` — enum `app_role` = `super_admin | company_admin | agent`, with `has_role()` security-definer
- `listings` — all fields from spec + `slug` (unique), `status` enum (draft/active/archived), `primary_media_type` enum
- `tracking_settings` — one row per company, all script fields + toggles
- `privacy_settings` — privacy/terms URLs + toggles
- `events` — page_view / media_click / video_play / cta_click / outbound_click
- `resolved_visitors` — placeholder contact rows

**RLS**
- Super admin: full access via `has_role(uid,'super_admin')`
- Company admin: scoped to their `company_id`
- Agent: read listings assigned to them + events for those listings
- Public read on `listings` (status=active) and `tracking_settings` for the public tour pages
- Public insert on `events` (anon-allowed, no PII)

**Storage buckets**: `listing-media` (public), `company-logos` (public)

**Auth**: email/password + Google. On signup, trigger creates `profiles` row; first user becomes super_admin via seed.

## Phase 2 — App Shell

- TanStack Router file-based routes under `_authenticated/`
- Left sidebar nav: Dashboard, Listings, Create Listing, Resolved Visitors, Tracking, Company Settings, Privacy Settings (Super Admin sees extra "Companies" entry)
- Design tokens in `src/styles.css`: deep black, soft slate, ivory whites, refined serif display + inter body, subtle shadow/elevation tokens

## Phase 3 — Authenticated Screens

1. **Dashboard** — KPI cards (listings, active, views, unique visitors), top listings, recent events
2. **Listings table** — address/city/state/price/status/views/branded+unbranded URL copy buttons/edit/analytics
3. **Create/Edit Listing** — full form, hero + gallery uploads to Storage, slug autogen with collision suffix
4. **Listing Analytics** — totals, branded vs unbranded split, daily chart (recharts), top referrers, recent events
5. **Resolved Visitors** — table + CSV export + status update buttons (placeholder integrations)
6. **Tracking Settings** — script textareas + toggles
7. **Company Settings** — branding fields + "Custom Domain Coming Soon" badge
8. **Privacy Settings** — URLs + toggles + default copy

## Phase 4 — Public Tour Pages

Public routes (no auth), SSR-friendly:
- `/tour/$slug` — branded
- `/u/$slug` — unbranded MLS-safe (strips agent/brokerage/CTAs)

**MediaEmbed component** — detects YouTube/Vimeo URLs → embed; Matterport/CloudPano/custom iframe; Mux placeholder; HTML5 video for direct URLs.

Layout: full-bleed hero media → details → gallery → description → secondary media → minimal footer. Mobile-first.

**Tracking injection**: fetch company `tracking_settings` server-side, inject scripts conditionally based on branded/unbranded toggles + privacy banner.

**Event capture**: client effect fires `page_view` on mount, click handlers fire `media_click` / `cta_click` / `outbound_click` — POST to public server route `/api/public/events` which inserts into `events` (Zod-validated, rate-limit-friendly).

## Phase 5 — Positioning Copy

- Admin banner on listing detail: "Use the unbranded URL for MLS virtual tour fields. Confirm local MLS rules before publishing."
- Resolved Visitors header: "Connect your identity-resolution or analytics provider using tracking settings."

## Technical notes

- TanStack Start + Supabase per integration rules; protected routes under `_authenticated/`, public tour pages top-level
- `createServerFn` with `requireSupabaseAuth` for admin reads/writes
- Public event insert via `/api/public/events` server route using server publishable client + `TO anon` insert policy
- CSV export client-side from queried rows
- Recharts for analytics charts
- Out of scope per spec: billing, CRM integrations, direct mail, real MLS API, transcoding, custom domains

Proceeding to build on approval.
