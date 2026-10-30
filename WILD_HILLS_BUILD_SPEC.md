# Wild Hills Real Estate: Website Build Spec (v2.1, custom backend & Stages 1–3 reconciled)

Put this file in the project root. Tell the agent: "Read WILD_HILLS_BUILD_SPEC.md. Do only the stage I name, then stop."

**Revision:** October 2026. External BaaS is removed. The backend is now a custom API built in this repository: PostgreSQL, a TypeScript API service, a job worker, and S3-compatible storage. 
**Current Repo State:** Stages 1, 2, and 3 are already executed, validated, and committed in the root directory. Stage 1b reconciles existing work into the monorepo architecture (`apps/web` and `packages/ui`) while strictly preserving all generated images, manifests, design tokens, and components.

## Contents

| Section | What it holds | Status in v2.1 |
|---|---|---|
| 0 | How to use this file, reading map, stage tracker, change list | Updated for completed Stages 1–3 |
| 1 | Project summary | Unchanged |
| 2 | Rules for the agent | Extended (backend and security rules) |
| 3 | Tech stack, monorepo structure, environment variables | Monorepo layout (`apps/web`, `packages/ui`) |
| 4 | Brand and design system | Unchanged |
| 5 | Assets | Preserved from Stage 2 |
| 6 | Routes and URL rules | Unchanged |
| 7 | Countries, locations, currency, language | Unchanged |
| 8 | Public features, page by page | Unchanged |
| 9 | Search and filters | Unchanged |
| 10 | Backend architecture, data model, and security | Custom backend (replaces external BaaS) |
| 11 | Admin dashboard | Separate app on its own origin |
| 12 | Images and uploads | Server-authoritative pipeline |
| 13 | Accessibility | Unchanged |
| 14 | Performance, SEO, analytics | Unchanged |
| 15 | Asset map | Output verified in Stage 2 |
| 16 | Build stages | Reconciled Stage 1b prompt; Stages 2 & 3 marked Done |
| 17 | Going public | Infrastructure checklist |

---

## 0. How to use this file

- Sections 1 to 15 are the specification (the rules and the full detail). Section 10 is the backend blueprint.
- Section 16 has one prompt per build stage. Paste ONE stage at a time, review the result, then paste the next.
- For a small-context model, say: "Read sections 1 to 3 plus the section(s) listed in the stage, then do the stage."
- Never ask for the whole site in one go.
- The backend stages (B1 to B6) can be run concurrently or sequentially with the frontend track.

### 0.1 Two tracks and one contract

The frontend and the backend meet at a written contract (the OpenAPI document generated from `packages/contracts`, Stage 5).

- **Frontend track:** Stage 1b (reconciliation), then Stage 4 (Layout shell), Stage 5 (Contract & mock mode), Stage 6 (Intro), Stage 7 (Country home), Stage 8, Stage 9, Stage 10, then Admin UI (11, 12).
- **Backend track:** B1 to B6.
- **Meeting points:** Stage 5 freezes the contract (`contract-v1`). Until the backend can serve it, the frontend runs against typed fixtures (`API_MODE=mock`). After B4 the frontend flips to `API_MODE=live`.

### 0.2 Stage tracker (update by hand)

| Stage | Track | Depends on | Status |
|---|---|---|---|
| 1 Project setup | Frontend | none | Done |
| 2 Assets and image pipeline | Frontend | 1 | Done (in root, moving to `apps/web`) |
| 3 Design system and components | Frontend | 1, 2 | Done (in root, moving to `packages/ui` & `apps/web`) |
| 1b Reconcile Stages 1–3 and repo hygiene | Both | 1, 2, 3 | Done |
| 4 Layout shell | Frontend | 1b (uses UI primitives) | Done |
| 5 Contract, typed client, mock mode | Both | 1b | Done (`contract-v1`) |
| B1 Backend foundation | Backend | 1b | Not started |
| B2 Database | Backend | B1, 5 | Not started |
| B3 Identity, sessions, authorization | Backend | B2 | Not started |
| B4 Public read API and search | Backend | B2, 5 | Not started |
| 6 Intro and country chooser | Frontend | 1b, 4 | Done |
| 7 Country home | Frontend | 4, 5 (B4 for live data) | Done |
| 8 Search and listings page | Frontend | 7 (B4 for live data) | Done |
| B5 Leads, submissions, files, jobs | Backend | B3, B4 | Not started |
| 9 Property page, leads, share cards | Frontend | 8 (B5 for live leads) | **NEXT TO RUN** |
| 10 Remaining public pages | Frontend | 9 | Not started |
| B6 Admin API | Backend | B3, B5 | Not started |
| 11 Admin app foundation and listings | Frontend | B6 | Not started |
| 12 Admin: leads, locations, content, users | Frontend | 11 | Not started |
| 13 Arabic, accessibility, SEO, performance pass | Both | 10, 12 | Not started |
| 14 Security review, QA, launch preparation | Both | 13 | Not started |

### 0.3 Reading map

| Stage type | Read |
|---|---|
| Frontend stages | Sections 1 to 3, then the sections the stage names |
| Backend stages (B1 to B6) | Sections 1 to 3, 7, 9, all of 10, and 11 (for B6) or 12 (for B5) |
| Stage 14 | Sections 10.13, 10.14, 13.8, 14, and 17 |

### 0.4 What changed from v1

- External BaaS is completely removed in favor of a custom PostgreSQL + Fastify API + worker queue.
- Work from Stages 1, 2, and 3 has already been completed in the root. Stage 1b transitions the existing code cleanly into `apps/web` and `packages/ui` using `git mv` without losing git history or re-processing assets.
- Generic design primitives move to `packages/ui` so `apps/web` and `apps/admin` can share them.

---

## 1. Project summary

**Wild Hills Real Estate** is a premium property SALES website (no rentals) covering four countries:

| Country | Code | Currency | Default language | Featured locations (shown on the country page) |
|---|---|---|---|---|
| United Arab Emirates | ae | AED | English | Abu Dhabi, Dubai |
| Turkey (Turkiye) | tr | TRY | English | Istanbul, Antalya (includes Alanya), Mersin |
| Georgia | ge | GEL | English | Tbilisi, Batumi |
| Egypt | eg | EGP | Arabic | New Cairo, New Capital (East Cairo); Sheikh Zayed, 6th of October (West Cairo); North Coast, Alexandria (Coast) |

Business model: buyers browse listings, send an inquiry, and the Wild Hills team guides them to purchase. Listings come from developers (off-plan and under construction) and owners (resale). All inquiries go to the Wild Hills team, never directly to the publisher. No online payments.

---

## 2. Rules for the agent (read first)

### 2.1 General rules

1. Work one stage at a time. At the end of each stage: run lint, typecheck, tests, and build; commit with a clear message; give a summary of at most 10 lines; STOP and wait.
2. Ask before any destructive action (deleting files, resetting the database, force-pushing, dropping a column). Prefer the simplest solution that meets the spec.
3. Never modify, move, or delete anything in `./source-images`. Never commit it (it is in `.gitignore`).
4. Never redraw or recreate the logo. Use the files in `/public/brand`. Never use files outside `/public/images` for photos.
5. Never put secrets in client code or in git. A secret exists only in the environment of the service that needs it.
6. No lorem ipsum. Use realistic, specific placeholder copy. Anything fake must be flagged `is_sample` in the data and labeled "Sample" in the UI.
7. No emoji icons. Use Lucide line icons (stroke 1.5).
8. No purple gradients, glassmorphism, neon glows, or heavy drop shadows. The site must look designed by a person, not generated.
9. TypeScript strict mode. Mobile-first. Accessible (see section 13).
10. Use logical CSS properties (`margin-inline-start`, `padding-inline`, `text-align: start`) so Arabic right-to-left works everywhere.
11. Do not invent facts about law, taxes, residency, data protection, or yields. Put clearly marked editable placeholders and a disclaimer instead.
12. If something in this spec conflicts or is unclear, choose the simplest reasonable option, write it in `DECISIONS.md`, and continue.

### 2.2 Backend and security rules

13. Layering: routes parse and respond, services hold the business rules and call the policy module, repositories talk to the database. A route never touches the database.
14. Every input passes through a Zod schema with `.strict()`. Every output is a dedicated DTO. Never return a raw database row.
15. All SQL is parameterized. Dynamic sorting uses an allow-list map. No SQL built from strings.
16. Migrations are forward-only and numbered. Never edit an applied migration.
17. Never log secrets, tokens, passwords, cookies, full emails, phone numbers, or message bodies.

---

## 3. Tech stack, monorepo structure, and environment

### 3.1 Stack

- **Public Site (`apps/web`):** Next.js App Router, TypeScript (strict), Tailwind CSS, next-intl (`en`, `ar`), Lucide icons, Framer Motion (subtle reveals only), react-hook-form + Zod.
- **Admin App (`apps/admin`):** Next.js App Router, English only, separate origin, strict CSP.
- **Backend (`apps/api`):** Fastify + TypeScript, Zod, OpenAPI 3.1, Drizzle ORM + PostgreSQL, `pg-boss` worker.
- **Storage:** S3-compatible (Cloudflare R2 default).
- **Email & Spam:** Resend (worker only), Cloudflare Turnstile (forms).

### 3.2 Monorepo structure

Stage 1b moves the existing project files into `apps/web` using `git mv`.

```
wild-hills/
  apps/
    web/                 public site (Stages 1–3 code): locales, SEO, ISR, styleguide
      app/[locale]/...
      components/        site-specific components (ListingCard, LocationCard, Gallery, etc.)
      lib/               image-manifest.ts, utils, data adapters
      public/            brand/, icons/, images/ (from Stage 2)
      scripts/           optimize-images.mjs, image-map.json
    admin/               admin app placeholder
    api/                 Fastify API and worker placeholder
  packages/
    contracts/           Zod schemas, enums, permissions, OpenAPI builder, fixtures
    api-client/          typed client with mock and live adapters
    ui/                  shared tokens, Tailwind preset, generic primitives (Button, Input, Badge, etc.)
    config/              tsconfig, eslint, prettier presets
  infra/                 docker-compose.yml
  source-images/         (git-ignored, never touched)
  DECISIONS.md  CHANGELOG.md  SECURITY.md  LAUNCH_CHECKLIST.md
```

### 3.3 Environment variables per app

| Variable | Lives in | Purpose |
|---|---|---|
| `SITE_URL`, `SITE_PRIVATE` | `apps/web` | Canonical URLs; global noindex switch |
| `API_BASE_URL` | `apps/web`, `apps/admin` | API endpoint |
| `API_TOKEN_WEB` | `apps/web` | Service credential for public API surface |
| `API_TOKEN_ADMIN` | `apps/admin` | Service credential for admin API surface |
| `REVALIDATE_SECRET` | `apps/web`, `apps/api` | HMAC key for on-demand ISR revalidation |
| `IMAGE_CDN_HOST` | `apps/web`, `apps/api` | Public CDN image host |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `apps/web` | Turnstile public widget key |
| `DATABASE_URL` | `apps/api` | PostgreSQL connection string |
| `S3_ENDPOINT`, `S3_BUCKET_PUBLIC`, etc. | `apps/api` | Storage configuration |
| `RESEND_API_KEY` | `apps/api` (worker) | Email sending |

---

## 4. Brand and design system

### 4.1 Tokens (`globals.css` and Tailwind)

| Token | Value | Use |
|---|---|---|
| navy | #101B33 | Headings, dark sections, footer, body text |
| navy-2 | #1A2848 | Cards on navy |
| ivory | #FAF8F3 | Main page background (60% of every page) |
| white | #FFFFFF | Cards on ivory |
| gold | #C99E4C | Lines, icons, button fills (with navy text) |
| gold-deep | #8A6A22 | Small gold text on ivory/white (contrast compliant) |
| gold-light | #E8D9B8 | Text on navy, subtle highlights |
| emerald | #1D7A52 | Verified tags, success states |
| emerald-deep | #14583D | Emerald hover state |
| mist | #E8F1EC | Pale green wash for alternate sections |
| sea | #24509E | Small accent line / map details |
| muted | #5A6378 | Secondary text |
| line | #E4DFD2 | Borders and dividers |

### 4.2 Typography & Shape

- Headings: **Lora** (500, 600). Body: **Inter** (400, 500, 600). Arabic: **IBM Plex Sans Arabic** (400, 500, 600).
- Radius: 4px buttons/inputs, 6px cards. Borders: 1px `line`. Shadows: none or subtle `0 1px 2px rgba(16,27,51,.06)`. Max container 1200px.

---

## 5. Assets (Generated in Stage 2)

All brand SVG assets are deployed in `apps/web/public/brand/`, icons in `apps/web/public/icons/` and `apps/web/app/`, and all 97 responsive WebP images are in `apps/web/public/images/`. Dimensions and base64 blur hashes are indexed in `apps/web/lib/image-manifest.ts`.

---

## 6. Routes and URL rules

- Root `/[locale]`: country chooser + intro. Cookie `wh_country` redirects returning visitors.
- Country subpath: `/[locale]/[country]/...` (`buy`, `property/[ref]-[slug]`, `projects`, `developers`, `sell`, `about`, `contact`).
- Search state stored strictly in URL search params (e.g. `?city=batumi&beds=2`).

---

## 7. Locations, currency, language

- **Countries:** UAE (`ae`, AED), Turkey (`tr`, TRY), Georgia (`ge`, GEL), Egypt (`eg`, EGP).
- **Locations:** Country > Region > City > District > Project > Unit.
- **Currency:** Listings store prices in minor units + currency code. Display currencies converted with cached daily exchange rates. Combined header control: "UAE · EN · AED".

---

## 8. Public features, page by page

### 8.1 Navbar
Two states: transparent over hero (ivory text, reversed logo); solid ivory on scroll (navy text, light logo, 1px gold bottom line). Hide on scroll down, reappear on scroll up. Buy mega dropdown with country cards. Full-screen mobile menu with focus trap.

### 8.2 Intro & Country Chooser (`/[locale]`)
2.5s SVG line animation (arch, cypress, hills, water, wordmark). Skippable. 4-panel interactive country selector (expands on hover on desktop, stacked on mobile).

### 8.3 Country Home (`/[locale]/[country]`)
12 editorial sections: Hero slideshow with search bar, Featured Locations, Hot Deals & New Launches, Why Wild Hills, Developer strip, Payment Plan Calculator, Country Buying Guide, Testimonials, FAQ, Blog posts, Final CTA, Footer.

### 8.4 Listings Page (`/buy`) & Property Page (`/property/[slug]`)
Desktop sticky filter sidebar / Mobile bottom sheet. Server-rendered pagination. Property detail has focal-point gallery, ZoomViewer floor plans, payment plan breakdown, Leaflet map, agent card, WhatsApp button, and inquiry forms.

---

## 9. Search and filters

Smart search with `pg_trgm`, `unaccent`, and `normalize_search()` folding. Filters: location, property type, price slider, status, installments, features. Handled server-side with normalized USD column `price_usd_minor`.

---

## 10. Backend architecture, data model, and security

- **PostgreSQL Database:** Tables for `users`, `sessions`, `passkeys`, `totp_factors`, `locations`, `developers`, `projects`, `listings`, `listing_images`, `leads`, `submissions`, `consents`, `audit_log`, `exchange_rates`.
- **Minor Units for Money:** BigInt values for prices.
- **Multilingual Content:** Dedicated `*_translations` tables with translation review status.
- **Security:** CSRF origin checks, `__Host-` cookies, mandatory MFA for staff, rate limiting, parameterized queries, least-privilege DB roles (`wh_owner`, `wh_api`, `wh_public_ro`, `wh_worker`).
- **Worker (`pg-boss`):** Image re-encoding with `sharp`, email sending with Resend, FX rate sync, ISR revalidation triggers.

---

## 11. Admin dashboard (`apps/admin`)

Isolated Next.js app on its own origin. English only. Connects exclusively to the API admin endpoints (`/v1/admin/*`). Covers listings management, review queue, location tree, leads CRM, and site settings.

---

## 12. Images and uploads

Browser compression for user convenience; worker performs authoritative validation, EXIF stripping, and WebP generation before writing to public storage. Floor plans trimmed and framed on ivory canvas.

---

## 13. Accessibility (WCAG 2.2 AA)

Semantic HTML, logical CSS properties (`margin-inline`, `padding-inline`), visible gold focus rings, keyboard trap on modals and sheets, full screen reader support, `prefers-reduced-motion` compliance.

---

## 14. Performance, SEO, and analytics

Mobile LCP < 2.5s, CLS < 0.1, INP < 200ms. JSON-LD structured data on all pages. OpenGraph dynamic share cards via `opengraph-image.tsx`. Cookieless privacy-friendly analytics.

---

## 15. Asset map

Preserved from Stage 2. All files are cataloged in `apps/web/lib/image-manifest.ts` and `CREDITS.md`.

---

## 16. Build stages (paste ONE prompt at a time)

### Stage 1b: Reconcile Stages 1–3 and set up monorepo

```
Read sections 2, 3, 10.2, 10.3, 10.4, and 10.13 (items H, C). Do only Stage 1b.
IMPORTANT CONTEXT: Stages 1, 2, and 3 have already been executed and committed in the root directory. Do NOT re-run image optimization or re-create UI components. Do NOT delete or overwrite existing work.
- Inspect the current workspace first and list existing files before making any changes.
- Remove every legacy BaaS dependency, import, folder, or variable. After this, searching for the removed BaaS must return nothing except DECISIONS.md.
- Convert the repository to the monorepo structure in section 3.2 using "git mv" so git history is preserved:
  - Move the current Next.js project into apps/web.
  - Keep apps/web/public/images, apps/web/public/brand, apps/web/lib/image-manifest.ts, and apps/web/scripts intact.
- Migrate from npm to pnpm workspaces and Turborepo. Configure root pnpm-workspace.yaml and turbo.json.
- Create packages/config with shared tsconfig, eslint, and prettier presets.
- Move the generic UI primitives from apps/web/components/ui (Button, Input, Select, Slider, Checkbox, Tabs, Badge, Accordion, Modal, Sheet, Toast, Skeleton, Pagination) into packages/ui, exposing them to both web and admin. Keep site-specific components (ListingCard, LocationCard, Gallery, FilterPanel, LeadForm, etc.) in apps/web/components.
- Scaffold apps/admin, apps/api, packages/contracts, and packages/api-client as placeholders (each with a valid package.json and README).
- Split the environment files per app using section 3.3. apps/web needs only SITE_URL, SITE_PRIVATE, API_BASE_URL, API_TOKEN_WEB, REVALIDATE_SECRET, IMAGE_CDN_HOST, and NEXT_PUBLIC_TURNSTILE_SITE_KEY.
- Apply security baseline in apps/web: headers from 10.13 item H2, and CSP in Report-Only mode (item H1).
- Add repository hygiene files at root: .nvmrc, packageManager pin, .editorconfig, CODEOWNERS, SECURITY.md, Renovate config, lefthook config with gitleaks, and GitHub Actions workflow.
- Write ADR-001 in DECISIONS.md explaining the migration to custom backend and monorepo, and record decisions D1 to D8 from 10.4 with the default choices.
Done when: pnpm install, lint, typecheck, and build pass at the repository root, /en/styleguide and /ar/styleguide still render with all components intact, and no legacy BaaS references remain. Then stop.
```

### Stage 2: Assets and image pipeline [COMPLETED]
*Status: Completed in root. Files and scripts migrated into `apps/web` during Stage 1b.*

### Stage 3: Design system and components [COMPLETED]
*Status: Completed in root. Primitives extracted to `packages/ui` and site components kept in `apps/web/components` during Stage 1b.*

### Stage 4: Layout shell (navbar, footer, control, banners)

```
Read sections 2, 6, 7.3, 7.4, 8.1, the footer item in 8.3, and 13. Do only Stage 4. All paths are relative to apps/web.
- Navbar with the two states (transparent over hero, solid ivory on scroll), hide-on-scroll-down, the Buy mega dropdown (placeholder constants for now), and the full-screen mobile menu (focus trap, Esc, scroll lock).
- The combined Country, Language, Currency control with cookies and URL changes.
- A currency provider that formats with Intl.NumberFormat. Use a small static rates object for now (Stage 7 replaces it with rates from the API client).
- The footer with a block per country (editable placeholder contacts), the cookie consent banner, the floating WhatsApp button, 404 and error pages.
- Arabic mirrors the whole layout cleanly (RTL).
Done when: the shell works on mobile, tablet, and desktop in both languages, and passes the keyboard test in 13.8. Then stop.
```

### Stage 5: Contract, typed client, and mock mode (contract freeze)

```
Read sections 2, 6, 7, 9, 10.5, 10.9, and 10.12. Do only Stage 5. No server code yet.
- In packages/contracts write Zod schemas (inputs use .strict()) and exported types for: enums and permission constants; Country, Location, Developer, Project; ListingSummary and ListingDetail (public DTOs only); SearchQuery (URL query keys and filters) and SearchResult; suggestion groups; content DTOs; CountrySettings; Rates; LeadCreate and SubmissionCreate; Problem (RFC 9457); money helpers (minor units).
- Add an OpenAPI 3.1 generator (pnpm contracts:openapi) that writes openapi.json for the public surface. Add a CI check that fails when the generated file differs from committed.
- In packages/contracts/fixtures create typed seed data: locations from 7.1 with featured pins from 7.2, 10 sample developers, ~24 sample listings (6 per country, is_sample), sample posts, FAQs, guides, testimonials, country settings, and rates.
- In packages/api-client write a typed client with mock and live adapters selected by API_MODE=mock or live. The mock adapter serves fixtures in memory.
- Wire apps/web to the client through apps/web/lib/data.ts. No component fetches data directly.
Done when: apps/web renders data in API_MODE=mock, openapi.json is committed, contract tests pass, and the commit is tagged contract-v1. Then stop.
```

### Stage B1: Backend foundation

```
Read sections 2, 3, 10.1 to 10.3, 10.9, 10.13 (items H, D5), and 10.16. Do only Stage B1.
- Create apps/api: Fastify with fastify-type-provider-zod, TypeScript strict, two entrypoints (server.ts and worker.ts), one Docker image.
- Config: single Zod-validated environment module.
- Plugins: request id, pino logging with redaction (item D5), RFC 9457 error handler, security headers, body size limits, graceful shutdown.
- Route registry requiring audience, permission, and rate-limit class declaration per route.
- Health endpoints: /v1/internal/healthz and /v1/internal/readyz. OpenAPI at /docs (non-prod).
- Local stack: infra/docker-compose.yml with PostgreSQL, MinIO, Mailpit, plus dev scripts.
- Multi-stage non-root Dockerfile and Vitest test harness with Testcontainers.
Done when: docker compose up works, /readyz is green, an unknown route returns problem+json, a fake auth header is logged as [REDACTED], and CI is green. Then stop.
```

### Stage B2: Database

```
Read sections 2, 7, 9.2, 9.3, 10.5, 10.6, and 10.17. Do only Stage B2. Ask before resetting any database.
- Drizzle schema and SQL migrations for every table in 10.5 (UUIDv7, minor units, timestamptz, version columns, translation tables, comments with pii flag). No favorites/saved_searches (decision D6).
- SQL files for extensions (pg_trgm, unaccent, citext), roles and grants (wh_owner, wh_api, wh_public_ro, wh_worker), public_* views, reference sequences, normalize_search() function with fixtures, indexes, CHECK constraints, publish guard trigger, audit append-only trigger.
- RLS policies on listings, leads, lead_notes, listing_documents, submissions, and withActor() helper.
- Seed commands for packages/contracts/fixtures and 50,000 synthetic listings for performance testing.
- Integration tests: migration tests, DB grants tests, RLS tests, normalize_search fixtures.
Done when: all database tests pass and the seed produces the same location and listing counts as the Stage 5 fixtures. Then stop.
```

### Stage B3: Identity, sessions, and authorization

```
Read sections 2, 10.7, 10.8, 10.13 (items A, H, D), and 10.17. Do only Stage B3.
- Users, invitations, passkeys (WebAuthn), TOTP, recovery codes, password fallback (Argon2id), sessions (hashed tokens, rotation, timeouts, step-up), login alerts, auth_events.
- __Host- cookies, CSRF protection (Origin, Sec-Fetch-Site, session-bound token), caller-credential validation.
- Rate limiting with progressive delays on auth routes.
- Central policy module authorize(actor, permission, resource) implementing the Section 10.8 matrix.
- Capability tokens for submitters with POST exchange and single-use validation.
Done when: table-driven authorization tests pass, session lifecycle tests pass, CSRF and brute force protections pass, and audit entries are generated for every auth event. Then stop.
```

### Stage B4: Public read API and search

```
Read sections 2, 6, 7.2, 7.3, 9, 10.5, 10.9, 10.12, and 14.2. Do only Stage B4.
- Public read endpoints in 10.9 served through wh_public_ro pool and public_* views.
- Listing search query builder matching filters from 9.2 on price_usd_minor with allow-listed sorts and pagination.
- Suggest endpoint with typo-tolerant matching via normalize_search() and trigram similarity.
- Locations tree, featured ordering, cached counts. Caching headers (Cache-Control, ETag, X-Cache-Tags).
- Validate parity with packages/api-client live adapter.
Done when: apps/web runs in API_MODE=live for read-only routes and passes all contract parity tests. Then stop.
```

### Stage 6: Intro and country chooser

```
Read sections 2, 4.5, 8.2, 13.3, and 15. Do only Stage 6. Paths relative to apps/web.
- Build the animated intro from wild-hills-symbol.svg as a React component (split layers: arch, hills, cypress, towers, water, wordmark), ~2.5s, skippable, no LCP penalty.
- Build the four-panel country chooser with desktop hover-expand and mobile stacked cards using Stage 2 panel images.
- Handle wh_country and wh_locale cookies and redirect returning visitors.
Done when: the intro plays once per session, is skippable, respects reduced motion, and the chooser works via keyboard. Then stop.
```

### Stage 7: Country home

```
Read sections 2, 4, 7.2, 8.3, 13, and 15. Do only Stage 7 for all 4 countries.
- Build all 12 sections in 8.3 in order with varied layout rhythm and alternating backgrounds.
- Hero slideshow with first image priority, pause button, gold progress bar, portrait crops for mobile, and rising search bar.
- Featured locations via lib/data.ts, with listing counts and "no listings here yet" empty state.
- Dynamic currency rates from API client. Payment plan calculator, buying guide placeholders, and animated counters.
Done when: all 4 country homes render with seeded data (mock or live), feel editorial, and meet 14.1 performance targets. Then stop.
```

### Stage 8: Search and listings page

```
Read sections 2, 7.3, 8.4, 8.7, 9, and 13.5. Do only Stage 8.
- Smart search box connected to suggest endpoint, full filters from 9.2, URL-based state, active filter chips, sort dropdown, Grid/Map toggle (lazy Leaflet), and 12-per-page pagination.
- Server-side filtering/sorting via API client (or mock adapter). No browser filtering.
- ListingCard with badges, dual currency display, favorite heart (localStorage), and compare checkbox with compare tray/table.
Done when: a shared search URL reproduces identical results and no filtering occurs in the browser. Then stop.
```

### Stage B5: Leads, submissions, files, and jobs

```
Read sections 2, 8.5, 8.6, 10.7, 10.9 to 10.11, 10.13, 10.15, 12, and 10.17. Do only Stage B5.
- Lead intake: POST /v1/public/leads with Turnstile verification, honeypot, fill-time checks, rate limits, Idempotency-Key, consents, and outbox row in one transaction.
- Submissions intake with capability links and token exchange.
- Presigned upload pipeline for assets; worker image processing with sharp, EXIF stripping, and WebP generation.
- Worker background jobs: send-email, fx-refresh, location-count, nightly-stats, expiry, retention, revalidate HMAC webhook.
Done when: a lead and a submission with photos can be submitted through the API, alert email arrives in Mailpit, and file security tests pass. Then stop.
```

### Stage 9: Property page, leads, and share cards

```
Read sections 2, 8.5, 10.12, 12.3, and 13. Do only Stage 9.
- Build property detail page: gallery with focal points and lightbox, key facts with sqm/sqft toggle, payment plan breakdown, ZoomViewer floor plans, map, agent card, and sticky mobile bar.
- Server Actions for "Request details" and "Book a viewing" with Zod, Turnstile, Idempotency-Key, and POST /v1/public/leads.
- WhatsApp button with prefilled message in visitor's language.
- Non-blocking view counter POST /v1/public/listings/{ref}/view.
- JSON-LD, OpenGraph, and dynamic opengraph-image.tsx share card with focal-point crop.
Done when: an inquiry submitted on the property page creates a lead in the database and triggers an alert email, and share cards render in English and Arabic. Then stop.
```

### Stage 10: Remaining public pages

```
Read sections 2, 8.6, 8.7, 10.7, 14.3, and 13. Do only Stage 10.
- City and area pages, projects and developers directories/details, buying guides per country, blog list and posts, FAQ, About, Contact, and Legal pages.
- Sell with us: property submission form with upload pipeline, tracking page via capability-link POST exchange, and clean status URL.
- SEO integration: metadata, hreflang alternates, canonicals, JSON-LD, and sitemaps.
Done when: every public route in section 3.2 exists with seeded content, is linked in navigation/footer, and Sell with us works end to end. Then stop.
```

### Stage B6: Admin API

```
Read sections 2, 10.5 to 10.11, 10.13, 11, 12.1, and 12.2. Do only Stage B6.
- Admin endpoints: listings CRUD with state machine transitions, assets and documents, locations management, leads CRM (assign, notes, status), settings, content, and users.
- Concurrency control via If-Match and entity version. Step-up MFA verification on sensitive endpoints.
- Formula-safe lead CSV export. Private document signed URLs (60s lifetime).
- Audit log entries and revalidation triggers on every mutation.
Done when: a listing can transition from submitted to published via the API alone with audit history and reference assignment. Then stop.
```

### Stage 11: Admin app foundation and listings

```
Read sections 2, 10.7, 10.8, 11, 12.1, and 12.2. Do only Stage 11.
- Build apps/admin (English only, separate origin, noindex, strict CSP).
- Authentication screens: passkeys, password + TOTP fallback, invitation acceptance, step-up modal, session timeout warning.
- Overview dashboard, Listings data table with filters and bulk actions, and multi-tab listing edit form.
- Photo and floor plan upload UI with progress, reordering, focal-point selection, and worker status polling.
- Review queue with approval checklist, change request notes, and reference number generation.
Done when: a listing can be reviewed, approved, and published through the admin UI and appears live on the public site. Then stop.
```

### Stage 12: Admin: leads, locations, content, users

```
Read sections 2, 7.2, 10.8, and 11. Do only Stage 12.
- Locations manager (tree view, featured pins, hide toggles, city request flow).
- Developers and projects manager with logo/map uploads and payment plan builder.
- Leads CRM with pipeline statuses, agent assignment, timeline notes, and CSV export.
- Content editors (blog, FAQ, guides, testimonials, hero text, country contacts) with translation review flags.
- Users & roles management (invite, country scoping, suspension, session revocation).
Done when: an editor can update hero copy, contact numbers, and location pins without code changes, and agent scopes are strictly enforced. Then stop.
```

### Stage 13: Arabic, accessibility, SEO, and performance pass

```
Read sections 13, 14, and 10.12. Do only Stage 13.
- Audit all pages in /ar across mobile and desktop; resolve bidirectional layout, spacing, and digit formatting issues.
- Run WCAG 2.2 AA audit (axe, Lighthouse accessibility >= 95, keyboard navigation pass).
- Verify Core Web Vitals on mobile throttled 4G (LCP < 2.5s, CLS < 0.1, INP < 200ms).
- Confirm ISR revalidation and stale-while-revalidate behavior when API is stopped.
- Move public site CSP from Report-Only to enforced.
Done when: a before-and-after audit table proves all Section 14.1 targets and accessibility requirements are met. Then stop.
```

### Stage 14: Security review, QA, and launch preparation

```
Read sections 10.13, 10.14, 10.15, 10.16, 10.17, 13.8, 14, and 17. Do only Stage 14.
- Verify security checklist in 10.13 item-by-item (headers, RLS, input schemas, rate limits, audit trail).
- Run security scanning tools: Semgrep/CodeQL, pnpm audit, gitleaks history scan, OWASP ZAP baseline scan.
- Execute performance load tests (k6 search and lead endpoints) and failure recovery drills.
- Perform database backup and restoration drill; document in docs/runbooks/restore-database.md.
- Complete end-to-end user journeys for all 4 countries on mobile screen sizes.
- Generate LAUNCH_CHECKLIST.md with each launch item marked Done, Blocked, or Needs Owner Input.
Do NOT set SITE_PRIVATE=false. Then stop.
```

---

## 17. Going public (checklist)

The site remains PRIVATE (`SITE_PRIVATE=true`, noindex) until this checklist is signed off.

### 17.1 Infrastructure & Security
- Scale database and hosting to production tiers.
- Secrets isolated per environment in secrets manager; rotate any keys used in development.
- Configure production domain, HTTPS with HSTS, DNSSEC, CAA records.
- Set up Cloudflare WAF, Turnstile production keys, and verify Resend sending domain (SPF/DKIM/DMARC).
- Verify automated daily backups and point-in-time recovery.

### 17.2 Legal & Content (Owner sign-off)
- Replace all placeholder contacts, license numbers, counters, and testimonials with real data.
- Ensure all sample listings and sample developer flags are addressed.
- Legal review of Terms, Privacy Policy, and country buying guides.
- Verify image licenses in `CREDITS.md`. Native speaker review of Arabic copy.

### 17.3 Launch
1. Set `SITE_PRIVATE=false` and trigger production deployment.
2. Submit sitemaps to Google Search Console and Bing Webmaster Tools.
3. Monitor error tracking and Core Web Vitals closely for the first 14 days.