# Wild Hills Real Estate - Architectural & Design Decisions

This document records key decisions, rationale, and conventions adopted during the development of the Wild Hills platform.

---

## Stage 1: Project Setup

### 1. Framework & Routing Architecture
- **Next.js App Router**: Selected Next.js 15 with React 19 and TypeScript strict mode.
- **Root Directory Structure**: Follows Section 3 strictly with root `app/`, `components/`, `lib/`, `messages/`, `public/`, `scripts/`, and `supabase/migrations/`.
- **i18n Solution**: Using `next-intl` (App Router plugin). Locales supported: `en`, `ar` (active), with scaffolding for `tr` and `ka` falling back to English.
- **Direction & Font Handling**:
  - `en`: LTR direction, using **Inter** for body text and **Lora** for headings.
  - `ar`: RTL direction, using **IBM Plex Sans Arabic** for both body and headings with logical CSS properties (`margin-inline-start`, `padding-inline`, `text-align: start`).

### 2. Styling & Design Tokens
- **Tailwind CSS v3**: Configured with CSS custom properties in `app/globals.css` exposing brand tokens:
  - `navy` (#101B33), `navy-2` (#1A2848)
  - `ivory` (#FAF8F3) (default background ~60%)
  - `white` (#FFFFFF)
  - `gold` (#C99E4C), `gold-deep` (#8A6A22), `gold-light` (#E8D9B8)
  - `emerald` (#1D7A52), `emerald-deep` (#14583D)
  - `mist` (#E8F1EC), `sea` (#24509E), `muted` (#5A6378), `line` (#E4DFD2)
- Strictly enforced contrast rules: `gold-deep` for small gold text on ivory/white; gold button fills use navy text.

### 3. Middleware & Privacy Controls
- `middleware.ts` intercepts requests:
  - When `SITE_PRIVATE=true`, injects `X-Robots-Tag: noindex, nofollow` into all outgoing HTTP headers.
  - Integrates `next-intl` routing middleware for `[locale]`.
  - Reads `wh_country` and `wh_locale` cookies: redirects returning users from root `/[locale]` to `/[locale]/[country]`.

---

## Stage 2: Assets and Image Pipeline

### 1. Selection of `share-default-v1.jpg` (Section 15.1)
Three source candidates were analyzed for `share-default-v1.jpg`:
1. `source-images/files2/share-default-v1.jpg`: 1200x630, 44,480 bytes, RGB color profile.
2. `source-images/files2/wild_hills_logo_pack/wild_hills_logo_pack/share-default-v1.jpg`: 1200x630, 38,709 bytes (identical channel statistics, slightly higher compression).
3. `source-images/wild-hills-separated-assets/share-default-v1.jpg`: 583x334, 27,859 bytes (low resolution, inadequate for OpenGraph 1200x630 requirements).

**Decision**: Selected **`source-images/files2/share-default-v1.jpg`** as the default share card. It is a full 1200x630 master image with the lowest compression artifacts and highest visual fidelity, while well within the 150 KB budget (only 43.4 KB).

### 2. Image Optimization & Budget Enforcement (Section 15.2 & 15.3)
- Created `scripts/optimize-images.mjs` using `sharp` to process and export all images to WebP (preserving AVIF for the 8 area cards).
- Implemented an iterative compression algorithm with `smartSubsample: true` that guarantees 100% compliance with Section 15.3 budgets (every hero under 300KB/180KB, cities under 120KB, card covers under 90KB).
- Generated `lib/image-manifest.ts` providing real dimensions, formats, and tiny base64 blur data URLs for every asset.
- Documented all credits in `public/images/CREDITS.md` with license status "to verify" per Section 15.5.
- Documented all gaps in `ASSETS_REPORT.md` (unassigned Kahramanmaras, temporary West Cairo placeholder using `cairo.webp`, and native resolutions for sample galleries without upscaling).

---

## ADR-001: Migration to Monorepo Architecture and Custom Backend

### Status
Accepted (Stage 1b)

### Context & Problem Statement
The initial Stage 1 setup was designed around an external BaaS (Supabase) within a monolithic Next.js repository at the root. While effective for initial prototyping, enterprise requirements for Wild Hills dictate:
1. Strict server-side authority over property assets, image pipelines (EXIF stripping, watermarking, WebP transformation), and editorial workflows.
2. Complete data residency, compliance, and eliminating third-party database vendor lock-in.
3. High-throughput, low-latency search and listing read endpoints with custom Turkish and Arabic full-text search indexing (`pg_trgm`, `unaccent`).
4. Isolated origin security: the public customer site (`apps/web`) and internal administrative CRM/CMS (`apps/admin`) operate under separate domain origins with isolated authentication models and distinct CSP policies.
5. Reuse of design primitives and tokens across both public and admin applications while keeping domain-specific components encapsulated.

### Decision
Migrate the repository to a **Turborepo + pnpm workspaces** monorepo layout, completely removing Supabase and establishing a custom TypeScript backend and background worker service. The existing codebase from Stages 1, 2, and 3 is relocated into `apps/web` and `packages/ui` using `git mv` to preserve commit history.

The architecture adopts the default choices for key architectural decisions D1 through D8 (from Section 10.4):

#### Decision D1: Database & ORM
- **Choice**: **PostgreSQL + Drizzle ORM** (Default)
- **Rationale**: PostgreSQL offers native support for extensions (`pg_trgm`, `unaccent`, `citext`), row-level security (RLS), and UUIDv7. Drizzle ORM provides zero-overhead, type-safe SQL query generation with explicit forward-only migrations and schema-as-code definitions.

#### Decision D2: Server Framework
- **Choice**: **Fastify** (Default)
- **Rationale**: Fastify provides unmatched throughput and low memory footprint compared to alternative Node frameworks. It offers native integration with `fastify-type-provider-zod` for request/response validation and automated OpenAPI 3.1 schema generation matching `packages/contracts`.

#### Decision D3: Repository Structure
- **Choice**: **pnpm workspaces + Turborepo monorepo** (Default)
- **Rationale**: Fast, disk-efficient package management (`pnpm`) combined with intelligent build caching (`turbo`). Establishes clean project boundaries:
  - `apps/web`: Public customer site (Next.js App Router, multi-locale, ISR).
  - `apps/admin`: Internal administration interface (Next.js App Router, English only, separate origin).
  - `apps/api`: Fastify API backend and `pg-boss` background worker.
  - `packages/contracts`: Zod schemas, OpenAPI 3.1 definitions, and seed fixtures.
  - `packages/api-client`: Typed isomorphic client with mock and live adapters.
  - `packages/ui`: Shared design tokens, Tailwind presets, and unstyled brand primitives.
  - `packages/config`: Shared TypeScript, ESLint, and Prettier configurations.

#### Decision D4: Authentication & Identity
- **Choice**: **Native auth with WebAuthn passkeys, sessions in DB with rotation, TOTP MFA for staff/admin** (Default)
- **Rationale**: Enterprise-grade passwordless authentication using the WebAuthn standard for staff, with TOTP secondary factors and cryptographically secure Argon2id password fallback. Sessions stored in PostgreSQL with strict rotation on privilege escalation and `__Host-` prefixed cookies. Seller submissions authenticate via time-limited, single-use capability tokens.

#### Decision D5: Queue & Background Worker
- **Choice**: **pg-boss** (Default)
- **Rationale**: Relies on PostgreSQL transaction queues (`pg-boss`) rather than introducing Redis infrastructure dependencies in phase 1. Enables transactional outbox patterns where mutations (e.g., lead capture) and job dispatches (e.g., email notification, ISR revalidation) commit atomically.

#### Decision D6: Scope Boundary (User Accounts)
- **Choice**: **No user-facing accounts, favorites, or saved searches in public phase 1** (Default)
- **Rationale**: Minimizes compliance risk, GDPR/KVKK footprint, and user friction. Property inquiries and "Sell with us" submissions function via verified contact details and capability URLs. User favorites are stored entirely client-side via `localStorage`.

#### Decision D7: Object Storage
- **Choice**: **S3-compatible storage (Cloudflare R2 default)** (Default)
- **Rationale**: Cloudflare R2 provides zero egress fee storage with global CDN caching. Direct client uploads use presigned URLs with worker-authoritative validation, EXIF removal, and WebP conversion before persisting to public storage.

#### Decision D8: Currency Handling & Multi-Currency Storage
- **Choice**: **Minor units (BigInt) for currency; daily cached FX rates table** (Default)
- **Rationale**: Avoids floating-point precision loss by storing all financial values in minor units (e.g., AED fills, cents, kuruş, tetri). Historical listing prices store the original currency along with a normalized USD minor-unit equivalent (`price_usd_minor`) for cross-country sorting. A background worker refreshes daily exchange rates in the `exchange_rates` table.

#### Decision D9: Layout Shell & Client Preferences (Stage 4)
- **Choice**: **Pass-through root layout with nested locale layout; CSS-driven transparent/solid navbar; cookie-persisted visitor preferences with URL synchronization** (Default)
- **Rationale**: 
  - Having a minimal root `app/layout.tsx` alongside `app/[locale]/layout.tsx` allows localized 404 pages (`app/[locale]/not-found.tsx`) to render inside the full site shell (preserving the header, footer, and RTL layout) while preventing double `<html>` document nesting.
  - Navbar transitions between transparent (over hero) and solid ivory (on scroll) using `data-nav-hero` and CSS attribute selectors, ensuring zero hydration mismatch. Hides on scroll-down and reveals on scroll-up or keyboard focus.
  - Visitor preferences (`wh_country`, `wh_currency`, `wh_consent`) are stored in client cookies and synced with the URL routing structure. Currency formatting uses `Intl.NumberFormat` with a minor-unit conversion layer.
  - Full-screen mobile navigation is built on the shared `@wild-hills/ui` Sheet/Dialog primitive, providing robust focus trapping, Esc key dismissal, and background scroll locking.

#### Decision D10: Domain Contracts, Typed Client, and Mock Adapter (Stage 5)
- **Choice**: **Zod schemas with `.strict()` for input validation; minor-unit money arithmetic; automated OpenAPI 3.1 generator with drift check; typed isomorphic client supporting `mock` and `live` modes; single data boundary at `apps/web/lib/data.ts`** (Default)
- **Rationale**:
  - Boundary validation is enforced using Zod schemas with `.strict()` on all input types (search, leads, submissions), preventing unknown property pollution and prototype poisoning attacks.
  - Public DTOs (`ListingSummary`, `ListingDetail`, `Location`, `Developer`, `Project`) strictly decouple database representations from public consumption.
  - All currency calculations and storage representations use integer minor units (cents, fils, kuruş, tetri) to avoid floating-point rounding errors.
  - The OpenAPI 3.1 specification (`openapi.json`) is generated directly from Zod definitions and checked for drift via CI script `pnpm contracts:openapi:check`.
  - The frontend accesses domain data exclusively through `apps/web/lib/data.ts` backed by `createApiClient()`. During UI development without a backend, `API_MODE=mock` serves fully typed fixtures with simulated network latency and in-memory filtering. Switching to `API_MODE=live` connects seamlessly to the Fastify API.

### Consequences
- **Positive**: Full sovereign control over data, security, and asset pipelines; zero BaaS vendor lock-in; unified type safety between frontend, admin, and backend; high developer velocity through Turborepo caching.
- **Negative / Trade-offs**: Requires maintaining custom migrations, worker queues, and infrastructure configurations (handled via `infra/docker-compose.yml` and Drizzle migrations).

