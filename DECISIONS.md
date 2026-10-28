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
