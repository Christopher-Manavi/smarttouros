# SmartTourOS

> **White-label smart listing tour platform that captures buyer intent signals while preserving MLS unbranded compliance.**

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
- **Unbranded MLS-safe tours** (`/u/:slug`) strip PII — agent name, phone, email, brokerage name, and logos — to satisfy MLS virtual-tour field requirements while still recording anonymized page-view events.
- **Intent capture** records `page_view`, `media_click`, `video_play`, `cta_click`, and `outbound_click` events into a structured event store.
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
│  │ /tour/:slug  │   │ /u/:slug     │   │ /api/public/events             │  │
│  │ (branded)    │   │ (unbranded)  │   │ (anonymous event ingestion)    │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┬──────────────────┘  │
└─────────┼──────────────────┼──────────────────────────┼─────────────────────┘
          │                  │                          │
          ▼                  ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVERLESS FUNCTION LAYER                            │
│  createServerFn + requireSupabaseAuth  │  Public server routes (no auth)      │
│  • Listing CRUD                       │  • get_public_tour SECURITY DEFINER  │
│  • Event aggregation                  │  • anon event insert                 │
│  • Tracking settings                  │  • Sitemap / robots / SEO            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD / SUPABASE                             │
│  PostgreSQL  │  Row Level Security  │  Storage (listing-media, company-logos)│
│  Auth        │  Magic Link / Email  │  Realtime (future)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow: Zillow 3D Tour Link → Intent Capture → Redirect

1. **Media ingestion.** A company admin or agent creates a listing in the dashboard, pasting a YouTube, Vimeo, Matterport, CloudPano, Mux, or direct video URL. The system stores the raw media URL and generates a unique slug.
2. **URL generation.** The platform emits two public URLs:
   - `https://smarttouros.com/tour/{slug}` — branded, full agent/brokerage identity and CTAs.
   - `https://smarttouros.com/u/{slug}` — unbranded, MLS-safe, PII-redacted.
3. **Public render.** A visitor clicks the link. The edge server function `get_public_tour` returns a sanitized bundle: listing media, description, and **only the fields appropriate to the route type**. Unbranded routes explicitly nullify agent name, phone, email, brokerage name, and logo.
4. **Event capture.** On mount, the client fires a `page_view` event to `/api/public/events`. Additional interactions (`media_click`, `video_play`, `cta_click`, `outbound_click`) are captured with `try/catch` fallbacks so analytics never block the user experience.
5. **Transparent redirect / embed.** The media renders inline via a `MediaEmbed` component (YouTube/Shorts, Vimeo, Matterport iframe, CloudPano, HTML5 video). For outbound tour links, the visitor is routed to the original destination while the event has already been recorded.
6. **Dashboard reporting.** Authenticated server functions aggregate events by listing, compute view counts, branded vs. unbranded splits, and recent activity, then render them in the listing analytics and performance report pages.

### Security Model

- **RLS-first design:** Every `public` table is created with explicit `GRANT` statements and row-level policies. No anonymous user can list companies, tracking settings, or other tenants' data.
- **SECURITY DEFINER function:** `get_public_tour(p_slug)` exposes only public-safe fields, preventing direct table access from public routes.
- **Storage isolation:** Storage paths are prefixed by `company_id`, and policies restrict reads to the owning company or public-safe listing media.
- **Role separation:** User roles live in a dedicated `user_roles` table with a `has_role()` security definer; roles are never stored on the profile table.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [TanStack Start v1](https://tanstack.com/start) | Full-stack React 19 framework with file-based routing, SSR, and `createServerFn` RPC |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Fast dev server and optimized production builds |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict mode, path aliases via `@/*` |
| **UI Library** | [React 19](https://react.dev/) | Component model with server/client boundaries |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Native CSS theme variables, custom color tokens, dark-mode SaaS aesthetic |
| **Components** | [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) patterns | Accessible dialogs, accordions, forms, tables, tooltips |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent iconography |
| **Charts** | [Recharts](https://recharts.org/) | Listing analytics time-series and KPI visualizations |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Type-safe validation |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query) | Caching, invalidation, suspense integration |
| **Backend / Auth** | [Lovable Cloud / Supabase](https://lovable.dev/) | PostgreSQL, Auth, Storage, Row Level Security |
| **Auth Client** | `@lovable.dev/cloud-auth-js` | Lovable-managed auth session bridge |
| **Server Runtime** | Cloudflare Workers (via TanStack Start / Nitro) | Edge server functions and SSR |
| **Package Manager** | [Bun](https://bun.sh/) (configured via `bunfig.toml`) | Fast installs and script execution |

---

## 4. Core Features

### MLS Compliance Guardrails

- **Dual URL strategy:** every listing gets a branded and an unbranded public URL.
- **PII stripping at the edge:** the unbranded route passes `null` for agent name, phone, email, brokerage name, and brokerage logo before rendering `TourView`.
- **MLS-safe UI copy:** unbranded links carry explicit "MLS-safe" labels and a compliance banner reminding users to confirm local MLS rules before publishing.
- **Privacy defaults:** `/privacy`, `/cookies`, `/privacy-choices`, and `/terms` public routes exist with fallback copy when a company has not configured custom legal URLs.

### Intent Capture

- **Event taxonomy:** `page_view`, `media_click`, `video_play`, `cta_click`, `outbound_click`.
- **Anonymous ingestion:** public `/api/public/events` route accepts events from non-authenticated visitors with Zod validation.
- **Real-time dashboards:** listing analytics and performance report pages query live event counts from Supabase.
- **CSV export:** agents can export visitor activity tables for offline analysis.

### Branded vs. Unbranded Tour Rendering

- `MediaEmbed` supports YouTube (including Shorts), Vimeo, Matterport, CloudPano, Mux placeholder, custom iframe, and direct HTML5 video URLs.
- Vertical Shorts render in a 9:16 container; standard videos render in 16:9.
- `SmartImage` component uses signed, permanent storage URLs with `object-fit` handling to eliminate broken gallery placeholders.

### Multi-Tenant Administration

- Role-based sidebar navigation: `super_admin` sees Companies; `company_admin` and `agent` see Listings, Analytics, Tracking, and Settings.
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
- A Lovable Cloud / Supabase project (backend is managed via Lovable Cloud)

### Install dependencies

```bash
bun install
# or
npm install
```

### Environment variables

The project uses Lovable-managed Supabase credentials. The following are injected automatically in the Lovable environment; for local development, ensure your `.env` contains:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
SUPABASE_PROJECT_ID=<project-ref>
```

> **Do not commit secrets.** These values are already present in the Lovable-managed environment and should be rotated through the Lovable dashboard, never hard-coded in source.

### Run the development server

```bash
bun dev
# or
npm run dev
```

The app will be available at `http://localhost:8080` by default.

### Build for production

```bash
bun run build
# or
npm run build
```

TanStack Start builds a serverless bundle suitable for Cloudflare Workers via Nitro.

### Lint and format

```bash
bun run lint
bun run format
```

---

## 6. Project Structure

```
src/
├── components/           # Reusable UI components (MediaEmbed, SmartImage, ListingForm, etc.)
├── hooks/                # Custom React hooks
├── integrations/         # Lovable Cloud / Supabase client, auth middleware, attacher
├── lib/                  # Business logic, utilities, demo data, compliance helpers
├── routes/               # TanStack Start file-based routes
│   ├── __root.tsx        # Root layout and global head metadata
│   ├── index.tsx         # Public marketing landing page
│   ├── auth.tsx          # Authentication gate
│   ├── _authenticated/   # Protected admin/agent dashboard routes
│   └── _public/          # Public tour and legal pages (no auth required)
├── router.tsx            # TanStack Router bootstrap with QueryClient
├── server.ts             # SSR error wrapper entry
├── start.ts              # TanStack Start instance with Supabase auth middleware
└── styles.css            # Tailwind v4 theme tokens and global styles
```

---

## 7. Future Roadmap

The current MVP hardens the core workflow: create listing → publish → copy MLS URL → record analytics. Enterprise extensions on the horizon include:

- **AI lead scoring:** classify visitor behavior (repeat views, CTA clicks, video completion) into lead temperature scores.
- **Automated CRM webhook syncing:** push resolved visitor events to Salesforce, HubSpot, Follow Up Boss, or KVCore in real time.
- **Identity resolution integrations:** connect IP-enrichment and form-capture providers to de-anonymize high-intent visitors.
- **Custom domains:** map `tours.yourbrokerage.com` to a company's branded tour pages.
- **Advanced analytics funnel:** session replay heatmaps, drop-off points, and A/B testing of CTA placement.
- **Lender sponsorship billing:** turn the existing "Unlock for FREE via Lender Sponsor" fake-door UI into a real co-marketing subscription flow.

---

## 8. License & Attribution

Built with [Lovable](https://lovable.dev) and [TanStack Start](https://tanstack.com/start).

This repository is intended as a portfolio showcase and MVP foundation. Commercial licensing and deployment decisions are left to the project owner.
