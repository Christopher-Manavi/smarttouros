# SmartTourOS

> **White-label smart listing tour platform that captures buyer intent signals while preserving MLS unbranded compliance.**

SmartTourOS is a **production-validated portfolio MVP**. It has been end-to-end tested against a live Lovable Cloud / Supabase backend, hardened through two security-hardening passes, and deployed to a production domain. It has **not** been independently penetration-tested, third-party security-audited, or formally compliance-certified.

---

## 1. Project Overview

### The Business Problem

Real estate media has become fragmented. Agents, photographers, and brokerages routinely embed third-party tours (Matterport, Zillow 3D Home, YouTube, Vimeo, CloudPano) into listing pages, then drive traffic to those same pages from Zillow, Realtor.com, and MLS systems. The result is a broken intent pipeline:

- **Buyer identity is lost** the moment a visitor leaves the agent-controlled page for a Zillow or Matterport experience.
- **Intent signals are invisible** — agents cannot see who watched a video, which room held attention, or which CTA was clicked.
- **MLS compliance conflicts with marketing** — many MLS boards require an unbranded, agent-neutral virtual tour link, which strips away the very contact information that converts leads.
- **Photographers and media companies have no recurring revenue model** beyond one-time shoot fees.

### The Solution

SmartTourOS wraps any media URL into a branded or unbranded tour landing page that remains under the agent's or media company's control. It is designed as an edge-first, serverless application:

- **Branded tours** (`/tour/:slug`) preserve agent/brokerage identity and drive direct contact.
- **Unbranded MLS-safe tours** (`/u/:slug`) strip PII — agent name, phone, email, brokerage name, and logos — server-side, so the browser response never contains disallowed fields.
- **Intent capture** records `page_view`, `media_click`, `video_play`, `cta_click`, and `outbound_click` events into a structured event store via a `SECURITY DEFINER` RPC.
- **Transparent routing** means the visitor still reaches the original Matterport, Zillow, YouTube, or custom tour URL, but the agent now owns the analytics layer around it.

The platform is built as a multi-tenant SaaS with role-based access (`super_admin`, `company_admin`, `agent`) and per-company data isolation.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL TRAFFIC                               │
│   Zillow listing ──► Realtor.com ──► MLS virtual-tour field ──► Social post │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMARTTOUROS PUBLIC EDGE                              │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────────────────┐  │
│  │ /tour/:slug  │   │ /u/:slug     │   │  record_public_event RPC        │  │
│  │ (branded)    │   │ (unbranded)  │   │  (SECURITY DEFINER)             │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┬──────────────────┘  │
└─────────┼──────────────────┼──────────────────────────┼─────────────────────┘
          │                  │                          │
          ▼                  ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVERLESS FUNCTION LAYER                            │
│  createServerFn + requireSupabaseAuth  │  SECURITY DEFINER RPCs (public)     │
│  • Listing CRUD                        │  • get_public_branded_tour          │
│  • Signed URL issuance (rate-limited)  │  • get_public_unbranded_tour        │
│  • Event aggregation (authenticated)   │  • record_public_event              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD / SUPABASE                             │
│  PostgreSQL  │  Row Level Security  │  Storage (listing-media, company-logos)│
│  Auth        │  Magic Link / Email  │  Private buckets, signed URLs only    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow: Public Tour Render

1. **Media ingestion.** A company admin or agent creates a listing in the dashboard and pastes a YouTube, Vimeo, Matterport, CloudPano, Mux, or direct video URL. Uploaded media is written to a private storage bucket under a `{company_id}/{listing_id}/{uuid}.ext` path. The listing gets a unique slug.
2. **URL generation.** The platform emits two public URLs:
   - `https://smarttouros.com/tour/{slug}` — branded, full agent/brokerage identity and CTAs.
   - `https://smarttouros.com/u/{slug}` — unbranded, MLS-safe, PII-redacted server-side.
3. **Public render.** A visitor clicks the link. The route calls one of two `SECURITY DEFINER` RPCs with an **explicit server-side field allowlist**:
   - `get_public_branded_tour(p_slug)` — returns listing, brokerage, agent, and company-branding fields.
   - `get_public_unbranded_tour(p_slug)` — returns only MLS-safe fields. The response **never contains** agent name/phone/email, brokerage name, brokerage logo, company branding, or address (unless `show_address_on_unbranded` is explicitly enabled on the listing).
4. **Signed media URLs.** For active listings, a `signPublicTourMedia` server function issues short-lived (60-minute) signed URLs against the private buckets. Draft or inactive listing media is never signed for public consumption. The unbranded pathway refuses to sign company or brokerage logo URLs.
5. **Event capture.** On mount, the client calls the `record_public_event` `SECURITY DEFINER` RPC with the slug and approved event metadata (`event_type`, referrer, UTM params, coarse device hints). The RPC derives `listing_id` and `company_id` server-side from the slug — the browser never supplies them, and anonymous users cannot directly insert into the `events` table.
6. **Dashboard reporting.** Authenticated server functions aggregate events by listing, compute view counts, branded vs. unbranded splits, and recent activity.

### Security Model

- **RLS-first design:** Every `public` table has explicit `GRANT` statements and row-level policies. Anonymous users cannot list companies, tracking settings, or other tenants' data.
- **`SECURITY DEFINER` RPCs for public reads:** `get_public_branded_tour`, `get_public_unbranded_tour`, and `record_public_event` are the only public entry points. Field allowlists live in the RPC bodies, not in client code.
- **Immutable `company_id`:** After onboarding, `profiles.company_id` is enforced immutable by a database trigger. Only `super_admin` or `service_role` may change it.
- **Trusted onboarding trigger:** `handle_new_user()` runs on `auth.users` insert and creates the company **before** inserting the profile — the profile is written with `company_id` already populated, so the immutability trigger never fires during signup.
- **Separate `user_roles` table:** Roles are never stored on `profiles`. Access is checked via a `has_role(user_id, role)` `SECURITY DEFINER` function to avoid RLS recursion.
- **Storage isolation:** `listing-media` and `company-logos` are **private** buckets. Authenticated access is gated by RLS policies that pin `bucket_id` and require the path's first segment to match the caller's `company_id`; `listing-media` additionally validates the `{company_id}/{listing_id}/...` prefix.
- **Server-side signing + rate limiting:** All public media URLs are generated server-side, only for `status = 'active'` listings, and the signing endpoint is rate-limited (60 requests/minute per caller).
- **No service-role credential in the browser bundle:** The client bundle ships only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is verified absent from `dist/client/` on every build.

---

## 3. Tech Stack

| Layer               | Technology                                                                                      | Purpose                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Framework**       | [TanStack Start v1](https://tanstack.com/start)                                                 | Full-stack React 19 framework with file-based routing, SSR, and `createServerFn` RPC |
| **Build Tool**      | [Vite 8](https://vitejs.dev/)                                                                   | Fast dev server and optimized production builds                                      |
| **Language**        | [TypeScript 5.8](https://www.typescriptlang.org/)                                               | Strict mode, path aliases via `@/*`                                                  |
| **UI Library**      | [React 19](https://react.dev/)                                                                  | Component model with server/client boundaries                                        |
| **Styling**         | [Tailwind CSS v4](https://tailwindcss.com/)                                                     | Native CSS theme variables, custom color tokens, dark-mode SaaS aesthetic            |
| **Components**      | [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) patterns | Accessible dialogs, accordions, forms, tables, tooltips                              |
| **Icons**           | [Lucide React](https://lucide.dev/)                                                             | Consistent iconography                                                               |
| **Charts**          | [Recharts](https://recharts.org/)                                                               | Listing analytics time-series and KPI visualizations                                 |
| **Forms**           | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)                       | Type-safe validation                                                                 |
| **Data Fetching**   | [TanStack Query v5](https://tanstack.com/query)                                                 | Caching, invalidation, suspense integration, signed-URL auto-refresh                 |
| **Backend / Auth**  | [Lovable Cloud / Supabase](https://lovable.dev/)                                                | PostgreSQL, Auth, Storage, Row Level Security                                        |
| **Server Runtime**  | Cloudflare Workers (via TanStack Start / Nitro)                                                 | Edge server functions and SSR                                                        |
| **Package Manager** | [Bun](https://bun.sh/)                                                                          | Fast installs and script execution                                                   |
| **Testing**         | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) (Python)                  | Unit tests and live E2E smoke tests                                                  |

---

## 4. Core Features

### MLS Compliance Guardrails

- **Dual URL strategy:** every listing gets a branded and an unbranded public URL.
- **Server-side PII stripping:** the unbranded RPC's field allowlist omits agent name/phone/email, brokerage name, brokerage logo, and company branding. The browser response never contains these fields.
- **Address gating:** unbranded routes only include street/city/state/zip when `show_address_on_unbranded` is explicitly enabled on the listing.
- **Unbranded logo suppression:** the signing pathway refuses to issue signed URLs for company or brokerage logos on the unbranded route.
- **Privacy defaults:** `/privacy`, `/cookies`, `/privacy-choices`, and `/terms` public routes exist with fallback copy when a company has not configured custom legal URLs.

### Intent Capture

- **Event taxonomy:** `page_view`, `media_click`, `video_play`, `cta_click`, `outbound_click`.
- **RPC-only ingestion:** all public events go through `record_public_event`, which validates event_type, derives `listing_id`/`company_id` from the slug server-side, and silently ignores unknown slugs. Anonymous `INSERT` on `public.events` is revoked.
- **Real-time dashboards:** listing analytics and performance report pages query live event counts.
- **CSV export:** agents can export visitor activity tables for offline analysis.

### Branded vs. Unbranded Tour Rendering

- `MediaEmbed` supports YouTube (including Shorts), Vimeo, Matterport, CloudPano, Mux placeholder, custom iframe, and direct HTML5 video URLs.
- Vertical Shorts render in a 9:16 container; standard videos render in 16:9.
- `SmartImage` consumes short-lived signed URLs with `object-fit` handling.

### Storage & Signed URLs

- **Private buckets:** `listing-media` and `company-logos` are private. No anonymous SELECT policy.
- **Tenant-isolated paths:** storage paths are structured as `{company_id}/{listing_id}/{uuid}.ext` for listing media and `{company_id}/{uuid}.ext` for logos. RLS validates the first (and, for listing media, second) path segment against the caller's `company_id`.
- **Public tour signing:** `signPublicTourMedia` (server function) issues 60-minute signed URLs, only for listings where `status = 'active'`. Signing is rate-limited to 60 requests/minute per caller.
- **Authenticated draft previews:** `useStorageSignedUrl` in `src/lib/storage-preview.ts` issues 15-minute signed URLs for the owning company, with TanStack Query auto-refresh well before expiry.
- **Automatic refresh:** both public (60-min) and authenticated (15-min) signed URLs refresh automatically in the client without user action.
- **Draft/inactive lockout:** draft or inactive listing media cannot receive public signed URLs — the server function refuses to sign them.
- **No permanent public URLs:** media URLs are never stored as permanent public links; every render fetches a fresh short-lived signed URL.

### Multi-Tenant Administration

- Role-based sidebar navigation: `super_admin` sees internal tools; `company_admin` and `agent` see Listings, Analytics, Tracking, and Settings.
- Company Settings: brand color, logo, phone, email, public base URL override.
- Tracking Settings: custom script injection into public listing pages with a verification panel.
- Privacy Settings: configurable legal URLs and toggles with fallback defaults.

### SEO & Indexing

- Public homepage is fully indexable with title, meta description, canonical URL, Open Graph, Twitter Card, and JSON-LD (`Organization` + `WebSite`).
- Public tour pages generate unique titles, descriptions, and `Product` JSON-LD from listing data.
- `/robots.txt` and dynamic `/sitemap.xml` expose public routes.
- Auth and dashboard routes carry `noindex, nofollow`.

---

## 5. Local Setup / Installation

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+ with `npm`
- A Lovable Cloud / Supabase project

### Install dependencies

```bash
bun install
```

### Environment variables

SmartTourOS uses two categories of configuration. **Only the `VITE_*` values are safe to ship in the browser bundle.**

**Client (browser-visible, non-secret):**

```env
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are the public client configuration. They are compiled into `dist/client/` and are visible to any browser that loads the app. This is expected and safe: the publishable key is **not** a service-role secret and has no elevated privileges. All security is enforced by RLS, `SECURITY DEFINER` RPC allowlists, and server-side signing.

**Server-only (must never be committed or exposed to client code):**

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS. Server functions only.
- Database passwords.
- GetUntitled or other third-party API credentials.
- Any other private secret.

These are read from `process.env.*` inside server-function `.handler()` bodies. They must never appear under `VITE_*`, in client imports, in the git tree in plain form, or in `dist/client/`. Every production build runs a bundle secret scan.

Do not print or commit actual key values to this repository or the README.

### Run the development server

```bash
bun dev
```

The app runs at `http://localhost:8080`.

### Build for production

```bash
bun run build
```

---

## 6. Project Structure

```
src/
├── components/                       # Reusable UI (MediaEmbed, SmartImage, ListingForm, TourView…)
├── hooks/                            # Custom React hooks
├── integrations/supabase/            # Client (browser), client.server (server), auth middleware
├── lib/
│   ├── tour-media.functions.ts       # signPublicTourMedia server function + rate limiter
│   ├── tour-media-paths.ts           # company/listing path validation helpers
│   ├── storage-preview.ts            # authenticated 15-min signed URL hook (auto-refresh)
│   ├── compliance.ts                 # legal URL fallbacks
│   └── public-url.ts                 # canonical public base URL
├── routes/                           # TanStack Start file-based routes
│   ├── __root.tsx                    # Root layout, global head metadata
│   ├── index.tsx                     # Public marketing landing page
│   ├── auth.tsx                      # Authentication gate
│   ├── _authenticated/               # Protected dashboard routes (super_admin gates on internal tools)
│   └── _public/                      # Public tour + legal routes (no auth)
├── router.tsx                        # Router bootstrap with QueryClient
├── server.ts                         # SSR error wrapper
├── start.ts                          # TanStack Start instance + Supabase bearer middleware
└── styles.css                        # Tailwind v4 theme tokens

tests/
├── unit/                             # Vitest: path validation, signed-URL refresh, etc.
└── e2e/                              # Playwright (Python): live tour smoke tests

supabase/
└── migrations/                       # SQL migrations: RLS, RPCs, triggers, storage policies,
                                      # get_public_branded_tour, get_public_unbranded_tour,
                                      # record_public_event, handle_new_user, immutable-profile guard
```

---

## 7. Testing & Verification

The MVP is validated by a repeatable local pipeline. None of these substitute for an independent security audit.

- **TypeScript typecheck** — `bunx tsgo --noEmit` runs clean with `strict: true`.
- **Production build** — `bun run build` produces a Cloudflare Workers-compatible bundle.
- **Vitest unit tests** — `bunx vitest run`. Coverage includes:
  - `tests/unit/tour-media-paths.test.ts` — path-validation coverage for `isSafeSegment`, `isListingMediaPath`, `isCompanyLogoPath` (wrong company, sibling listing, traversal, backslash, leading/trailing slash, empty inputs).
  - `tests/unit/storage-preview-refresh.test.ts` — signed-URL auto-refresh scheduling.
  - `tests/unit/public-tour-refresh.test.ts` — public tour signed-URL refresh behavior.
- **Live browser / E2E smoke tests** — `tests/e2e/tour-smoke.live.py` (Playwright, Python) drives a real browser against a running app to confirm:
  - branded tour renders agent, brokerage, and address fields;
  - unbranded tour response contains no agent, brokerage, or company-logo fields;
  - signed media URLs return 200; expired/unauthorized paths return the expected non-200;
  - `record_public_event` accepts valid events and silently ignores unknown slugs.
- **Client-bundle secret scan** — every build greps `dist/client/` for `service_role`, `sb_secret_`, and known password patterns. A match fails the release.

Not claimed: independent penetration test, third-party security audit, or formal compliance certification (SOC 2, ISO 27001, HIPAA, etc.).

---

## 8. My Role

**Christopher Manavi** identified the business problem, designed the product and workflow architecture, directed the AI-assisted implementation, configured the data and security model (RLS, `SECURITY DEFINER` RPCs, storage policies, immutable-tenant guards), tested the full production workflow end-to-end, and iterated the system through two security-hardening passes and deployment validation on a live domain.

---

## 9. Future Roadmap

The current MVP hardens the core workflow: create listing → publish → copy MLS URL → record analytics. Extensions on the horizon include:

- **AI lead scoring:** classify visitor behavior (repeat views, CTA clicks, video completion) into lead temperature scores.
- **Automated CRM webhook syncing:** push resolved visitor events to Salesforce, HubSpot, Follow Up Boss, or KVCore in real time.
- **Identity resolution integrations:** connect IP-enrichment and form-capture providers to de-anonymize high-intent visitors.
- **Custom domains:** map `tours.yourbrokerage.com` to a company's branded tour pages.
- **Advanced analytics funnel:** session replay heatmaps, drop-off points, and A/B testing of CTA placement.
- **Lender sponsorship billing:** turn the existing "Unlock for FREE via Lender Sponsor" fake-door UI into a real co-marketing subscription flow.

---

## 10. License & Attribution

Built with [Lovable](https://lovable.dev) and [TanStack Start](https://tanstack.com/start).

This repository is intended as a portfolio showcase and production-validated MVP foundation. Commercial licensing and deployment decisions are left to the project owner.
