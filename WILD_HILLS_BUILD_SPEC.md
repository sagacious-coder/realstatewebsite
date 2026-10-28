# Wild Hills Real Estate: Website Build Spec

Put this file in the project root. Tell the agent: "Read WILD_HILLS_BUILD_SPEC.md. Do only the stage I name, then stop."

## 0. How to use this file

- Sections 1 to 15 are the specification (the rules and the full detail).
- Section 16 has one prompt per build stage. Paste ONE stage at a time, review the result, then paste the next.
- For a small-context model, say: "Read sections 1 to 7 plus the section(s) listed in the stage, then do the stage."
- Never ask for the whole site in one go.

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

Goals: professional, high-trust, modern, human-made (not template-looking), very fast, multi-country, multi-language, multi-currency, with an easy admin dashboard.

---

## 2. Rules for the agent (read first)

1. Work one stage at a time. At the end of each stage: run lint, typecheck, and build; commit with a clear message; give a summary of at most 10 lines; STOP and wait.
2. Ask before any destructive action (deleting files, resetting the database, force-pushing). Prefer the simplest solution that meets the spec.
3. Never modify, move, or delete anything in `./source-images`. Never commit it (it is in `.gitignore`).
4. Never redraw or recreate the logo. Use the files in `/public/brand`. Never use files outside `/public/images` for photos.
5. Never put secrets in client code. Secrets live only in `.env.local` (git-ignored). Provide `.env.example`.
6. No lorem ipsum. Use realistic, specific placeholder copy. Anything fake must be flagged `is_sample` in the data and labeled "Sample" in the UI.
7. No emoji icons. Use Lucide line icons (stroke 1.5).
8. No purple gradients, glassmorphism, neon glows, or heavy drop shadows. The site must look designed by a person, not generated.
9. TypeScript strict mode. Mobile-first. Accessible (see section 13).
10. Use logical CSS properties (`margin-inline-start`, `padding-inline`, `text-align: start`) so Arabic right-to-left works everywhere.
11. Do not invent facts about law, taxes, residency, or yields. Put clearly marked editable placeholders and a disclaimer instead.
12. If something in this spec conflicts or is unclear, choose the simplest reasonable option, write it in `DECISIONS.md`, and continue.

---

## 3. Tech stack and project structure

- Next.js (latest stable, App Router) + TypeScript (strict)
- Tailwind CSS with brand tokens as CSS variables
- shadcn/ui for accessible primitives (restyled to the brand)
- next-intl for i18n (locales: `en`, `ar`; scaffold `tr` and `ka` with empty files that fall back to English)
- Framer Motion only where CSS cannot do the job (intro, hero, page-level reveals); everything else uses CSS
- Supabase: Postgres, Auth (with MFA for staff), Storage, Row Level Security
- Zod for validation; react-hook-form for forms
- Leaflet + OpenStreetMap (loaded lazily only on map views), credit "© OpenStreetMap contributors"
- `sharp` on the server for image processing; `browser-image-compression` in the browser for uploads
- Resend for email (lead alerts); Cloudflare Turnstile for spam protection on all public forms
- Hosting: Vercel. Database: Supabase. (Use free plans while building privately. Move to Vercel Pro and Supabase Pro when the site goes public: see section 17.)

Structure:

```
wild-hills/
  app/
    [locale]/
      page.tsx                      (global: intro + country chooser)
      [country]/                    (ae | eg | ge | tr)
        page.tsx                    (country home)
        buy/page.tsx                (search + filters)
        property/[slug]/page.tsx    (listing detail + opengraph-image.tsx)
        [city]/page.tsx             (city page)
        [city]/[area]/page.tsx      (area page)
        projects/ and projects/[slug]/
        developers/ and developers/[slug]/
        guides/[slug]/page.tsx      (buying guide per country)
        blog/ and blog/[slug]/
        sell/page.tsx  contact/page.tsx  about/page.tsx  faq/page.tsx
        legal/[doc]/page.tsx        (privacy, terms, cookies)
    admin/                          (English only, protected)
    api/                            (cron, webhooks)
    favicon.ico  icon.svg  apple-icon.png  manifest.ts
  components/  lib/  messages/  supabase/migrations/  scripts/
  public/brand/  public/icons/  public/images/
  source-images/                    (git-ignored, never touched)
  DECISIONS.md  .env.example
```

---

## 4. Brand and design system

### 4.1 Tokens (put in `globals.css` as CSS variables and expose in Tailwind)

| Token | Value | Use |
|---|---|---|
| navy | #101B33 | Dark sections, footer, hero overlay, headings, body text |
| navy-2 | #1A2848 | Cards on navy |
| ivory | #FAF8F3 | Main page background (about 60% of every page) |
| white | #FFFFFF | Cards |
| gold | #C99E4C | Lines, icons, button fills (always with navy text) |
| gold-deep | #8A6A22 | Small gold TEXT on ivory or white (passes contrast) |
| gold-light | #E8D9B8 | Text on navy, soft highlights |
| emerald | #1D7A52 | Secondary accent, "Verified" and "Ready" tags, success |
| emerald-deep | #14583D | Hover state for emerald |
| mist | #E8F1EC | Pale green wash for alternate sections |
| sea | #24509E | Tiny accent only (map details, links, one decorative water line) |
| muted | #5A6378 | Secondary text |
| line | #E4DFD2 | Borders and dividers |

Contrast rules: never use `gold` for small text on ivory or white (use `gold-deep`); gold buttons use navy text; white text on emerald is allowed.

### 4.2 Typography

- Headings: **Lora** (weights 500 and 600; it matches the logo wordmark). Body: **Inter** (400, 500, 600).
- Arabic (both headings and body): **IBM Plex Sans Arabic** (400, 500, 600).
- Georgian (phase 2): Noto Sans Georgian. Turkish characters are covered by Inter and Lora.
- Load with `next/font`, only the needed weights, only the subsets needed by each locale, `display: swap`.
- Scale: H1 clamp(2.25rem, 5vw, 4rem); H2 clamp(1.75rem, 3.2vw, 2.75rem); body 16 to 17px with line-height 1.6. Max text width 68ch.
- Buttons and nav links use sentence case, never all caps.

### 4.3 Shape and spacing

- Radius: 4px for buttons and inputs, 6px for cards, 0 for full-bleed images. Borders 1px `line`.
- Shadows: none, or at most `0 1px 2px rgba(16,27,51,.06)`.
- Container max width 1200px. Section padding 96px desktop, 56px mobile. 8px spacing grid.
- Layouts must feel editorial: vary section rhythm, use asymmetric two-column layouts, large photography, thin gold rules. Do NOT stack identical rounded cards everywhere.

### 4.4 Components (build once, reuse)

Button (primary gold, secondary navy outline, ghost, on-navy ivory outline), Input, Select, Slider, Checkbox, Tabs, Badge (Verified, Hot deal, New launch, Ready, Off-plan, Sold, Reserved), ListingCard, LocationCard, DeveloperLogoStrip, Gallery, Lightbox, ZoomViewer, FilterPanel, FilterChips, Pagination, Modal/Sheet, Toast, Accordion (FAQ), Skeleton, SectionHeading, Counter, WhatsAppButton, LeadForm.

### 4.5 Motion (subtle and professional)

- Section reveal: fade-up 24px, 600ms ease-out, stagger 80ms (IntersectionObserver, once).
- Image hover: scale 1.03 over 700ms. Nav link: gold underline slides in over 250ms. Button color: 200ms.
- Counters count up once when visible (1.2s).
- Hero and intro: see section 8.1 and 8.2.
- EVERYTHING must respect `prefers-reduced-motion` (replace motion with simple fades or nothing).
- No parallax, no scroll-jacking, no bouncing, no auto-playing audio or video.

---

## 5. Assets (already prepared: use them, do not recreate)

**Brand files** in `/public/brand`:
`wild-hills-logo-full-light.svg` (ivory/white backgrounds), `wild-hills-logo-full-reversed.svg` (navy backgrounds), `wild-hills-logo-nav-light.svg`, `wild-hills-logo-nav-reversed.svg` (navbar: symbol + wordmark), `wild-hills-symbol.svg` (arch only), `share-default-v1.jpg` (1200x630 default share card).

**Icons:** `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`; `public/icons/icon-192.png` and `icon-512.png` referenced by `app/manifest.ts`.

**Photos:** optimized WebP in `/public/images`, produced by `scripts/optimize-images.mjs` from the raw files in `./source-images` (the exact file-by-file map, budgets, and known gaps are in section 15):
- `egypt|georgia|turkey|uae/hero/*.webp` (2400x1350) and `*-portrait.webp` (1200x1600, for phones)
- `egypt|georgia|turkey|uae/cities/*.webp` (1000x750); `areas/*.webp` (1000x750)
- `defaults/` apartment and villa sample galleries; each `*cover*.webp` has a `-card.webp` (1200x900 for 4:3 cards)
- blog covers (1200x800), sell-with-us (1400x1000), floor plan and map templates
- Generate `lib/image-manifest.ts` listing every file with its real width, height, and a tiny blur placeholder (base64), by reading the files at build time. Always use these real dimensions.

If a needed image does not exist yet, show a clean navy-to-mist placeholder block with the Wild Hills symbol, never a stock URL.

Use Next.js `<Image />` for every photo: correct `sizes`, `placeholder="blur"`, lazy loading by default, and `priority` ONLY on the first hero image. Configure `images.remotePatterns` for the Supabase Storage host.

---

## 6. Routes and URL rules

- Root `/[locale]`: intro and country chooser (section 8.2). If cookie `wh_country` exists, redirect to `/{locale}/{country}`. Crawlers must still see server-rendered links to all four countries.
- Country pages live under `/[locale]/[country]/...` (see structure in section 3).
- Search state lives in the URL query string, for example `/en/ge/buy?city=batumi&type=apartment&beds=2&max=150000`, so searches are shareable and the back button works.
- Listing URL: `/[locale]/[country]/property/[ref]-[slug]` where ref looks like `WH-GE-00042`.
- Locale default per country: ae, ge, tr use `en`; eg uses `ar`. The visitor can switch between `en` and `ar` at any time; the choice is stored in a cookie.
- `hreflang` alternates for every page and locale; canonical URLs; `sitemap.xml` and `robots.txt` generated.

---

## 7. Countries, locations, currency, language

### 7.1 Location tree

Country > Region > City > District/Area > Project > Unit. Each location has names in en, ar, tr, ka (fallback to en).

Seed these locations:

- **UAE:** Abu Dhabi (areas: Al Reem Island, Yas Island, Saadiyat Island, Al Raha Beach), Dubai (areas: Palm Jumeirah, Downtown Dubai, Dubai Creek Harbour, Dubai Marina), plus searchable only: Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, Fujairah.
- **Turkey:** Istanbul (areas: Kadikoy), Antalya (areas: Konyaalti; includes Alanya), Mersin; searchable only: Bodrum, Fethiye, Izmir, Ankara, Bursa, Yalova, Trabzon.
- **Georgia:** Tbilisi (areas: Vake), Batumi (areas: New Boulevard); searchable only: Kutaisi, Kobuleti, Gudauri, Bakuriani, Rustavi.
- **Egypt:** New Cairo (areas: Fifth Settlement), New Capital, Sheikh Zayed, 6th of October, North Coast (including New Alamein and Ras El Hekma as areas), Alexandria; searchable only: Hurghada, El Gouna, Ain Sokhna, Sahl Hasheesh, Sharm El Sheikh, Mostakbal City, Giza.

### 7.2 Featured versus all

- **Featured locations** appear as photo cards on each country's home page and in the "Buy" dropdown. They are ordered automatically by a `sales_score` (sold units, active listings, and inquiries in the last 90 days, refreshed nightly), but the admin can PIN or HIDE any location manually. At launch the featured list is pinned exactly as in the table in section 1.
- **All locations** are reachable through the search box, the location filter, and a "Browse all cities" link, grouped by region and sorted alphabetically.
- Egypt shows six cards, grouped under small labels (East Cairo, West Cairo, Coast). Other countries show two or three cards.
- A location with zero listings still appears, marked: "No listings here yet. Tell us what you are looking for." That opens a lead form tagged with country, city, and budget.

### 7.3 Currency

- Each listing stores its price in its own currency (`price_amount` + `price_currency`).
- The visitor picks a display currency from: the country currency, USD, EUR, GBP, AED, EGP, TRY, GEL. Converted prices are shown with "approx." and "Rates updated {date}". The original price is always visible.
- Rates are stored in the `exchange_rates` table (base USD), refreshed daily by a cron job from a free rates source (make the provider configurable). If the fetch fails, keep the last rates.
- Format with `Intl.NumberFormat` for the active locale; Arabic uses Arabic-Indic digits only if the visitor selects that (default: Western digits).

### 7.4 One combined control

A single header control "UAE · EN · AED" opens a popover with three groups: Country, Language, Currency. Changing country navigates to that country's equivalent page; language and currency change in place. Choices persist in cookies.

---

## 8. Public features, page by page

### 8.1 Navbar

- Height 88px at the top of the page, 64px after scrolling (desktop); 64px and 56px on mobile.
- **State 1 (page top):** transparent over the hero, using `wild-hills-logo-nav-reversed.svg`, ivory text. **State 2 (after scrolling 40px):** solid ivory, thin gold bottom line (1px), `wild-hills-logo-nav-light.svg`, navy text. Smooth 250ms transition. It slides up out of view when scrolling down and returns when scrolling up.
- Links (max five): **Buy** (opens a mega dropdown: four countries, each with a photo and its featured cities, plus a "Browse all cities" link), **Areas**, **Projects**, **Contact**, and a gold **Sell with us** button. Active link has a gold underline; hover slides the underline in.
- Right side: the combined Country · Language · Currency control (section 7.4) and a small WhatsApp icon button.
- **Mobile:** hamburger opens a full-screen navy menu with large serif links that fade in one after another, the country/language/currency control, and a gold "WhatsApp us" button. Locks body scroll; focus trap; Esc closes.
- **Property pages on mobile:** sticky bottom bar with Call, WhatsApp, Request details.
- Arabic: the whole navbar mirrors (logo on the right).
- Keyboard accessible, visible gold focus ring, `aria-expanded` on menus.

### 8.2 Intro and country chooser (`/[locale]`)

- Shown only at the root for first-time visitors without the `wh_country` cookie, and only once per session (`sessionStorage`). Returning visitors are redirected straight to their country.
- **Intro (about 2.5 seconds, skippable by click, tap, or Esc):** full-screen navy. The arch from `wild-hills-symbol.svg` draws itself in gold (stroke-dashoffset), then the hills, cypress, and towers fade in, then the water, then the wordmark. Build it as a React component by reading the SVG and splitting its layers. Do not use a video or photos here, so it loads instantly. Content underneath must already be rendered so the intro never delays the page (do not block LCP).
- **Country chooser:** four tall panels (images from `/public/images/panels/*`, or the first hero crop as a placeholder). On desktop, hovering a panel expands it (flex-grow transition) while the others narrow; the country name, a one-line teaser, and city names fade in. On mobile the panels stack vertically as full-width cards. Clicking sets cookies (`wh_country`, `wh_locale`) and goes to the country home.
- A "Change country" option is always available in the header control.

### 8.3 Country home (`/[locale]/[country]`)

Order of sections (vary the layout rhythm; alternate ivory, white, mist, and navy backgrounds):

1. **Hero** (full viewport height, minus the navbar on mobile):
   - Background: 3 hero photos for the country. The first loads with `priority`; the other two load after the page is idle. Crossfade every 7 seconds (1.2s fade), each with a slow zoom (scale 1.0 to 1.08 over 9s). Phones use the `-portrait` images.
   - A navy gradient overlay (left to right and bottom to top) so text stays readable.
   - Headline in Lora, revealed line by line from behind a mask (700ms, 120ms stagger). Default headline: "Find a home that fits your life." Subline: "Homes across Egypt, UAE, Georgia, and Turkey." (editable in admin).
   - A thin gold progress line shows slide timing. Pause on hover and when the tab is hidden.
   - **Search bar** rises in last (translateY with fade): four fields (Location, Property type, Bedrooms, Budget) + Search button + "More filters" link + a "Live in / Invest" toggle that pre-sets sensible filters (Live in: ready, furnished options; Invest: off-plan and residency or yield filters).
2. **Featured locations:** photo cards (see 7.2) with listing counts, plus "Browse all cities".
3. **Hot deals and new launches:** 6 listing cards, with a "View all" link.
4. **Why Wild Hills:** an editorial two-column block with three or four short points and counters (years, homes sold, clients). Counters are editable and marked as placeholders until real numbers exist.
5. **Developers we work with:** logo strip in one tone (grayscale) that turns to full color on hover. Logos from `/public/images/developers` (placeholders flagged until real logos with permission exist).
6. **Payment plan calculator:** price, down payment %, years, optional post-handover. Outputs the monthly installment and a simple visual timeline. Clear disclaimer: indicative only, not a mortgage offer.
7. **Buying guide for this country:** steps, required documents, typical costs and fees as EDITABLE placeholders with a visible "to be confirmed by our legal team" flag, and a note that rules change.
8. **Testimonials:** 3 short quotes, first name and area, initials avatar (no fake photos).
9. **FAQ:** accordion, content per country.
10. **From the blog:** 3 latest posts.
11. **Final call to action:** navy section with a Contact button and WhatsApp button.
12. **Footer** (navy): `wild-hills-logo-full-reversed.svg`, links, a block per country (phone, WhatsApp, email, address, hours, license number as an editable field), language and currency, social links, legal links, copyright.

### 8.4 Listings page (`/buy`)

- Desktop: filter panel on the left (sticky), results on the right. Mobile: a "Filters" button opens a bottom sheet with a sticky button "Show 128 homes" that updates live.
- Top bar: result count, sort (Newest, Price low to high, Price high to low, Size, Most popular, Hot deals first), and a Grid / Map toggle (map loads lazily).
- Active filters appear as removable chips. All filter state is in the URL.
- 12 results per page with pagination (server-rendered for SEO). Skeleton cards while loading.
- Listing card (4:3 image using the `-card` variant when available): cover photo, badges (Verified, Hot deal, New launch, Off-plan, Ready, Sold, Reserved), price in the chosen currency with the original beneath, location, beds, baths, size, heart (favorite), compare checkbox. Image hover zoom 1.03.
- Empty state: friendly message plus the "Tell us what you are looking for" lead form.

### 8.5 Property page (`/property/[ref]-[slug]`)

- **Gallery:** large main image with a thumbnail strip; first image eager, the rest lazy. Tap for a full-screen lightbox with swipe and keyboard arrows. Images use the stored focal point.
- **Header:** title, reference number (WH-AE-00123), location breadcrumb, badges, price (chosen currency and original), "Share" button (copies the link; uses the Web Share API on phones).
- **Key facts:** type, beds, baths, size (sqm with an sqft toggle), plot size, floor, furnished, construction status, handover year.
- **Payment plan block:** down payment %, years, post-handover, installments; mini calculator.
- **Description** (the current language, falling back to English) and **amenities** with line icons.
- **Floor plan:** shown inline at 1200px. Tapping opens the full-screen ZoomViewer which loads the 2400px file only then; supports pinch-zoom, double-tap zoom, drag, and zoom buttons.
- **Location:** if the project has a map image (1600x1000) show it, with distance chips below (for example "25 min to Dubai Intl"), labeled "Approximate distances". Otherwise show a lazily loaded Leaflet map from the coordinates. Credit OpenStreetMap.
- **Developer and project** block with the developer logo and a link to the project page.
- **Your Wild Hills agent** card: photo, name, languages, WhatsApp button. (Never show the publisher's contact details.)
- **Request details** form (name, phone with country code, email, preferred language, message, consent checkbox, Turnstile) and **Book a viewing** (in person or video call, preferred date and time). Both create a lead.
- **WhatsApp button:** opens `https://wa.me/{number}?text={encoded}` with a prefilled message containing the reference and the page link, in the visitor's language.
- **Similar listings** (same city and similar price).
- **Mobile:** sticky bottom bar (Call, WhatsApp, Request details).
- Structured data (JSON-LD), OpenGraph, and the per-listing share image (section 12.3).
- Disclaimer line: "Prices and availability are subject to change. Plans and distances are indicative."

### 8.6 Other pages

- **City and area pages:** hero image, short guide text, market snapshot placeholders, featured listings, a listing count, and links to sub-areas.
- **Projects and developers:** a listing grid with filters (country, city, developer, status, handover year), and detail pages with description, payment plan, amenities, location map, and the units available.
- **Sell with us:** a form for owners and developers (country, city, property type, expected price, description, photos upload, contact details, consent). It creates a listing with status `submitted` plus a lead, emails the submitter a private tracking link (magic link, no password), and shows a clear explanation of how review works. Copy: no promises of speed or price.
- **Contact:** general form (including a "preferred language" field) and one block per country: phone, WhatsApp, email, address with a map link, working hours in local time, license or registration number (editable). Links to the social profiles.
- **About:** story, team (portraits with names and languages), office photo, values.
- **FAQ, Blog (list and posts), Legal (Privacy, Terms, Cookies), 404, and a friendly error page.** Legal text is placeholder content clearly marked "requires legal review per country".

### 8.7 Favorites, compare, recently viewed (no account needed)

- Favorites saved in `localStorage` (heart icon); a Favorites page lists them.
- Compare up to 3 listings side by side (price, size, beds, location, payment plan, features) in a clean table; a floating compare tray appears when 2 or more are selected.
- "Recently viewed" row on the listings page.
- Each uses a small client store with `localStorage`, wrapped in try/catch, and works if storage is unavailable.

---

## 9. Search and filters

### 9.1 Smart search box

One input that searches cities, districts, projects, developers, and reference numbers. Results are grouped by type, with counts ("Batumi (46)"), keyboard navigation, and accent-insensitive, typo-tolerant matching (Postgres `pg_trgm` and `unaccent`; for example Istanbul and Istanbul with a dotted capital I, and Arabic names for the same city). Options with zero results are dimmed but still selectable (they open the "no listings yet" lead form). Include a "Browse all cities" tree grouped by region.

### 9.2 Filters (sale listings only)

| Group | Filters |
|---|---|
| Location | Country, region or city, district or area, project, developer |
| Property | Type (apartment, villa, townhouse, penthouse, duplex, studio, chalet, land, commercial), bedrooms (studio to 6+), bathrooms, size range with a sqm/sqft toggle, plot size (villas and land) |
| Price | Slider plus min and max boxes, in the visitor's chosen currency (convert to the listing currency server-side for matching) |
| Status | Ready, under construction, or off-plan; handover year; furnished, semi-furnished, unfurnished |
| Payment | Installments available, down payment %, plan length in years, post-handover plan, bank financing available |
| Features | Sea view, city view, garden, private pool, balcony or terrace, parking, maid's room, smart home, gym, 24/7 security, beachfront, golf, children's area |
| Investment | Residency or citizenship eligible, estimated yield range (labeled as estimates with a note that rules change; never as guarantees) |
| Quality | Verified, hot deal, new launch, price reduced, has video tour, has floor plan, listed in the last 7 or 30 days |

### 9.3 Server side

- All filtering, sorting, and pagination happen in the database through a function or query builder (never filter large lists in the browser).
- Add indexes on: country_code, location_id, price (normalized USD column), property_type, bedrooms, review_status, handover_year, is_hot_deal, published_at. Add a GIN index for features.
- Keep a normalized `price_usd` column, recomputed when exchange rates change or a price changes, so price filters and sorting are fast and consistent across currencies.
- Listing counts per location are cached in `locations.listing_count` and refreshed by triggers and the nightly job, never counted live on each visit.

---

## 10. Data model and security

### 10.1 Tables (write SQL migrations in `supabase/migrations`)

- `locations` (id, parent_id, type [country|region|city|district], slug, country_code, name_en, name_ar, name_tr, name_ka, lat, lng, is_featured, featured_rank, is_hidden, listing_count, sales_score, updated_at)
- `developers` (id, slug, name, logo_path, description_en/ar/tr/ka, country_codes[], website)
- `projects` (id, developer_id, location_id, slug, name, description_*, status, handover_date, payment_plan jsonb, amenities text[], lat, lng, map_image_path, distances jsonb [{type,label,minutes,km}])
- `listings` (id, ref unique like WH-AE-00123, slug, country_code, location_id, project_id, developer_id, publisher_id, assigned_agent_id, listing_type [off_plan|resale|land], property_type, title_* and description_* per language, price_amount, price_currency, price_usd, bedrooms [0 = studio], bathrooms, size_sqm, plot_sqm, floor, furnished, construction_status [ready|under_construction|off_plan], handover_year, payment_plan jsonb {down_payment_pct, years, post_handover, installments}, bank_financing, features text[], residency_eligible, est_yield_min, est_yield_max, lat, lng, cover_image_id, floor_plan_path, video_url, brochure_path, is_hot_deal, is_featured, is_verified, is_new_launch, price_reduced_at, review_status [draft|submitted|needs_changes|approved|published|reserved|sold|archived], review_notes, published_at, last_confirmed_at, expires_at, views, is_sample, created_at, updated_at)
- `listing_images` (id, listing_id, path, width, height, position, focal_x, focal_y, alt_en/ar)
- `listing_documents` (id, listing_id, kind, path) in a PRIVATE bucket
- `profiles` (id = auth user, full_name, phone, whatsapp, role [buyer|publisher|staff|admin], country_codes[], avatar_path, languages[])
- `leads` (id, created_at, country_code, listing_id, location_id, name, email, phone, preferred_language, budget_min, budget_max, budget_currency, message, source [request_details|viewing|sell_with_us|no_listings_here|contact|brochure], status [new|contacted|viewing|reserved|closed], assigned_to, notes, consent boolean, utm jsonb)
- `exchange_rates` (id, base, rates jsonb, fetched_at)
- `audit_log` (id, actor_id, action, table_name, record_id, diff jsonb, created_at)
- `posts`, `faqs`, `guides`, `testimonials`, `site_settings` (per-country contacts, license numbers, hero headlines, counters)
- Phase 2 (create the tables now, build the UI later): `favorites`, `saved_searches`

Reference numbers: generate `WH-{COUNTRY}-{5 digit sequence}` with a database sequence per country.

### 10.2 Row Level Security (enforced in the database, never only in the UI)

- Public can read ONLY listings with `review_status = published` (or reserved/sold, shown with a label) and their images, plus locations, developers, projects, and published content.
- Publishers can insert listings and edit ONLY their own listings while status is draft, submitted, or needs_changes. They cannot publish, verify, feature, or change the assigned agent.
- Staff can read and edit listings and leads for their assigned countries. Admin can do everything.
- Leads: anyone can INSERT through a server action (with Turnstile and rate limiting); only staff and admin can read or update them.
- Private documents: readable only by staff, admin, and the owner.
- `audit_log` is written by database triggers for listing price, status, and verification changes; nobody can update or delete rows.

### 10.3 Security checklist

- Supabase Auth with email and magic link; staff and admin require TOTP two-factor authentication.
- Validate every input with Zod on the server. Limit file types and sizes on every upload.
- Turnstile and per-IP rate limiting on all public forms.
- Service-role key only on the server. Never expose it in client code.
- Secure headers (CSP, X-Frame-Options, Referrer-Policy). Cookie consent banner. Consent checkbox on every form.

---

## 11. Admin dashboard (`/admin`, English only, mobile-friendly)

Use a ready admin framework (Refine with the Supabase data provider) styled to the brand, or shadcn/ui data tables and forms. Do not hand-build everything from scratch.

Screens:

1. **Overview:** new leads, listings awaiting review, listings expiring soon, simple charts.
2. **Listings:** table with filters and bulk actions. The edit form has tabs: Basics, Details, Payment plan, Photos, Floor plan and documents, Location, Languages (one tab per language), Review.
3. **Review queue** for submissions: checklist (ownership documents present, price sanity, photos original and no contact details, no duplicate), buttons: Approve, Request changes (with a note emailed to the submitter), Reject. Approve generates the reference number and can set the Verified badge.
4. **Lifecycle:** draft, submitted, needs_changes, approved, published, reserved, sold, archived. Published listings must be re-confirmed every 30 to 60 days (configurable) or they auto-hide, with an email reminder 7 days before.
5. **Locations manager:** tree view, featured pin and hide toggles, rename, add a city (staff can request, admin approves), listing counts.
6. **Developers and projects** with logo upload, payment plan builder, map image upload, and distances list.
7. **Leads inbox:** pipeline statuses (New, Contacted, Viewing, Reserved, Closed), assign to an agent, internal notes, filter by country, language, and source, CSV export. New leads email the right country team.
8. **Content:** blog, FAQ, guides per country, testimonials, hero headlines, counters, per-country contact details, and license numbers.
9. **Users and roles** (admin only), with MFA enrollment prompts.
10. **Audit log** viewer.

---

## 12. Images and uploads

### 12.1 Upload pipeline (listing photos, in the admin and the "Sell with us" form)

In the browser, before upload: accept JPG, PNG, WebP, HEIC; reject images under 1600px wide with a clear message; fix rotation; strip EXIF (remove GPS); resize to a maximum of 2000px on the long edge; convert to WebP at about 80% quality using `browser-image-compression`. Show per-file progress and a preview. Rules: at least 5 and at most 25 photos per listing; drag to reorder; one cover image; alt text field.

**Focal-point picker:** on the cover photo (and optionally each photo) the uploader clicks the main subject. Store `focal_x` and `focal_y` (0 to 1) and use them for `object-position` on cards and for the share card crop. Add a checklist line: "Main subject in the middle of the frame."

Crop rules to remember: 3:2 masters are shown at 4:3 on cards (about 5.5% trimmed from each side) and at 1.91:1 in share cards (about 21% trimmed from the height), so the subject must sit in the middle 80% across and 70% down.

### 12.2 Floor plans

- Accept PNG, JPG, or WebP. On the server with `sharp`: trim empty margins, place on an ivory (#FAF8F3) canvas 2400px wide with even padding (about 80px), and add a small footer strip: "Indicative plan. Dimensions approximate." Export a 2400px WebP (target about 150KB, hard cap 250KB) and a 1200px WebP for inline display.
- DO NOT automatically remove logos or watermarks. Plans contain required information (dimensions, unit numbers, legal notes). Instead show the reviewer a warning: "Check that the plan is clean and keeps the developer's required legal text." Rejected plans are sent back to the developer.
- Project location maps: 1600x1000 WebP under 120KB, uploaded per project (not per unit).

### 12.3 Share cards (link previews)

- Generate a unique 1200x630 image per listing with `opengraph-image.tsx` (`next/og`): the cover photo (cropped around the focal point) with a navy gradient strip at the bottom, the title, the price (listing currency), the location, a small Wild Hills logo, and a "Sold" or "Reserved" ribbon when relevant.
- Keep ALL important content inside the central 630x630 square with at least 60px margin so a square crop (common in WhatsApp) loses nothing. Fall back to `/brand/share-default-v1.jpg` when there is no photo (use `/brand/share-ar-v1.jpg` when the page language is Arabic).
- Cache-busting: the share image URL includes a version based on the listing's `updated_at`, for example `?v=1730000000`, so WhatsApp and Facebook refresh after edits. Version the default card by filename (`share-default-v2.jpg` after any change).
- Load the Lora and IBM Plex Sans Arabic font files inside the image route. Test Arabic text rendering; if it fails, fall back to English text on the card.
- Keep each share image under about 150KB.

---

## 13. Accessibility (target: WCAG 2.2 level AA)

### 13.1 Structure and semantics

- One `<h1>` per page, headings in order, landmarks (`header`, `nav`, `main`, `footer`), and a "Skip to main content" link as the first focusable element.
- Set `<html lang>` and `dir` per locale (`en` = ltr, `ar` = rtl). Mark inline foreign text with its own `lang`.
- Every meaningful image has alt text (listing photos use `alt_en` / `alt_ar`; fall back to "{title}, photo {n}"). Decorative images use `alt=""`.
- Icons used as the only content of a button get an `aria-label`. Decorative icons get `aria-hidden="true"`.

### 13.2 Keyboard and focus

- Everything works with the keyboard alone: Tab order follows the visual order (in Arabic, the mirrored order).
- Visible focus ring on every interactive element: 2px gold outline with 2px offset (on navy backgrounds use ivory).
- Menus, sheets, the lightbox, and the ZoomViewer trap focus while open, close on Esc, and return focus to the button that opened them.
- Mega dropdown: opens on click or Enter (hover is only an extra), `aria-expanded` is kept in sync, arrow keys move between items.

### 13.3 Motion and media

- All motion follows section 4.5 and `prefers-reduced-motion`. With reduced motion: no zoom, no slide, no line-by-line mask; crossfades become instant swaps and the hero stays on the first image.
- The hero slideshow has a visible Pause / Play button (not only pause on hover), keyboard reachable.
- The intro is skippable, hidden from screen readers (`aria-hidden`), and never traps focus. The page content underneath must be reachable immediately.
- No autoplay audio or video. Video tours (when added) have captions or a transcript link.

### 13.4 Forms

- Every field has a visible `<label>` (no placeholder-only labels), correct `type` and `autocomplete` values (`name`, `email`, `tel`), and a clear error message tied to the field with `aria-describedby`.
- On submit errors, move focus to the first invalid field and announce a summary in an `aria-live="polite"` region.
- Phone field: country-code select plus number. Consent checkbox has its own label and a link to the privacy page.
- Turnstile uses the managed (non-puzzle) mode. If it fails to load, show a clear message and an email or WhatsApp fallback.
- Toasts use `role="status"`; blocking errors use `role="alert"`.

### 13.5 Specific components

- **Gallery and lightbox:** previous/next buttons, arrow keys, thumbnail buttons with accessible names ("Photo 3 of 12"), a visible close button.
- **ZoomViewer (floor plan):** gesture zoom is never the only way: provide Zoom in, Zoom out, Reset buttons and arrow-key panning.
- **Price slider:** always paired with min and max number inputs. The slider has `aria-valuetext` including the currency.
- **Map view:** every map has a list alternative (the Grid view). Markers are not the only way to reach a listing.
- **Compare tray and tables:** real `<table>` with `<th scope>`; the tray announces "2 listings selected".
- **Accordion (FAQ):** buttons with `aria-expanded` and `aria-controls`.
- **Filter bottom sheet:** the live count button ("Show 128 homes") updates through an `aria-live` region.

### 13.6 Color, size, and touch

- Use the contrast rules in section 4.1 (`gold-deep` for small gold text on light backgrounds). Never rely on color alone (badges also carry text; errors also carry an icon and text).
- Body text stays readable at 200% zoom with no horizontal scroll (except tables, code, and maps inside their own scroll container).
- Touch targets are at least 44x44px on mobile. Spacing between adjacent targets is at least 8px.

### 13.7 Arabic and right-to-left

- Use logical CSS properties everywhere (rule 10). Mirror directional icons (arrows, chevrons, "next"); do NOT mirror the logo, maps, phone numbers, or the play icon.
- Phone numbers, reference numbers (`WH-EG-00042`), prices, and email addresses are wrapped in `<bdi>` or `dir="ltr"` so they do not scramble inside Arabic text.
- The IBM Plex Sans Arabic text uses line-height 1.7 and no letter-spacing, and uppercase styles are never applied to Arabic.
- Test every page in `/ar` at mobile and desktop widths.

### 13.8 Testing checklist (done before each stage is accepted when it adds UI)

1. Automated: `axe` (via `@axe-core/playwright` or the browser extension) reports no serious or critical issues; Lighthouse accessibility score is 95 or higher.
2. Keyboard-only pass: reach and operate every control on the page without a mouse.
3. 200% zoom and a 360px wide viewport: nothing is cut off.
4. Reduced-motion pass: system setting on, confirm no movement.
5. One screen reader spot check per major flow (search, property page, lead form) with VoiceOver or NVDA.
6. Arabic pass: layout mirrored, numbers readable, no clipped text.

---

## 14. Performance, SEO, and analytics

### 14.1 Performance targets (mobile, throttled 4G, measured with Lighthouse and real-user data after launch)

| Metric | Target |
|---|---|
| Largest Contentful Paint | under 2.5 s (hero image is the LCP element, so it must be small and `priority`) |
| Cumulative Layout Shift | under 0.1 (always set image width and height from the manifest) |
| Interaction to Next Paint | under 200 ms |
| JavaScript on first load | under 170 KB gzipped for a public page |
| Lighthouse (mobile) | Performance 90 or higher; Accessibility, Best Practices, SEO 95 or higher |

Rules to reach them:

- Server Components by default. Add `"use client"` only for interactive parts (filters, galleries, forms, calculator, hero slideshow).
- Load these ONLY when needed, with dynamic imports: Leaflet (map views), Framer Motion (intro and hero), Lightbox, ZoomViewer, the full 2400px floor plan, Turnstile (when a form scrolls near the viewport).
- Hero: first image `priority` with `fetchPriority="high"`; the other two load on idle. Never autoplay video.
- Photo budgets are in section 15.3. Never serve an original from `source-images`.
- Fonts: `next/font` with `display: swap`, only the weights and subsets listed in 4.2. Preload only the body font of the active locale.
- No third-party scripts except Turnstile (on forms only) and the analytics script (after consent).
- Cache: static assets immutable for one year with hashed names; images through the Next.js optimizer.

### 14.2 Rendering and caching strategy

| Page type | Strategy |
|---|---|
| Country home, city, area, guides, blog, FAQ, legal | Static with revalidation (about 1 hour) plus on-demand revalidation when admin edits content |
| `/buy` search results | Dynamic server rendering with the search state from the URL; counts come from cached columns (section 9.3) |
| Property page | Static with on-demand revalidation when the listing, price, or status changes; `views` counter updated by a non-blocking server action |
| Admin and API | Dynamic, never cached, never indexed |

### 14.3 SEO

- Unique `<title>` and meta description per page and locale, generated from templates, for example: "{beds}-bedroom {type} for sale in {area}, {city} | Wild Hills". Titles under 60 characters, descriptions under 155.
- `hreflang` for `en` and `ar` plus `x-default` (do not emit `tr` or `ka` until they are really translated). Canonical on every page.
- `/buy`: the canonical URL drops sort and pagination parameters except `page`. Pages with more than two active filters get `noindex, follow`. City and area pages are the indexable "landing pages" for search.
- Structured data (JSON-LD): `Organization` and `RealEstateAgent` (per country, from `site_settings`), `BreadcrumbList` on all inner pages, `RealEstateListing` with an `Offer` on property pages, `FAQPage` on FAQ content, `Article` on blog posts. Only output values that really exist in the data.
- `sitemap.xml` split per country and locale, with `lastmod` from `updated_at`. `robots.txt` blocks `/admin` and `/api`. While the site is private, the whole site is `noindex` (controlled by `SITE_PRIVATE=true`; see section 17).
- Sold or reserved listings stay online with the label for 90 days, then become `noindex`. Archived listings return 410 Gone.
- Internal links: breadcrumbs, "Similar listings", area links on city pages, and a footer link to each country.
- Every page must be fully readable with JavaScript disabled in the server-rendered HTML (search results, listing details, and country links).

### 14.4 Analytics (privacy first)

- Use a cookieless or consent-gated tool (Plausible or Vercel Web Analytics; keep the provider configurable). Load it only after consent when the tool sets identifiers.
- Track these events with no personal data: `lead_submit` (source, country), `whatsapp_click`, `call_click`, `filter_used` (filter name only), `search_submit`, `calculator_used`, `share_click`, `compare_add`, `favorite_add`.
- Never send names, emails, or phone numbers to analytics.

---

## 15. Asset map: your prepared files to the spec

The folder you prepared is the RAW source. Copy it, untouched, into `./source-images` (git-ignored). The agent never edits it. Stage 2 creates `scripts/image-map.json` and `scripts/optimize-images.mjs` (with `sharp`) that read from `source-images` and write the optimized files to `public/images`, then generate `lib/image-manifest.ts`.

### 15.1 Brand files and logo rules

| Source file | Goes to |
|---|---|
| `files2/wild_hills_logo_pack/wild_hills_logo_pack/wild-hills-logo-full-light.svg` and `-reversed.svg`, `wild-hills-logo-nav-light.svg` and `-reversed.svg`, `wild-hills-symbol.svg` | `public/brand/` (same file names) |
| `.../favicon.ico` | `app/favicon.ico` |
| `.../favicon.svg` | `app/icon.svg` |
| `.../apple-touch-icon.png` (or `wild-hills-separated-assets/favicon-180.png`) | `app/apple-icon.png` |
| `.../icon-192.png`, `icon-512.png` | `public/icons/icon-192.png`, `icon-512.png` |
| `wild-hills-separated-assets/share-ar-v1.jpg` | `public/brand/share-ar-v1.jpg` (default share card when the page language is Arabic) |
| `wild-hills-separated-assets/og-image-square.jpg` | `public/brand/og-square-v1.jpg` |
| The ONE chosen `share-default-v1.jpg` (see the warning below) | `public/brand/share-default-v1.jpg` |

Reference only (do NOT ship to the site): `wild_hills_logo_pack_preview.png`, `favicon-ico-preview.png`, `intro-screen.png` (a visual reference for the intro animation in section 8.2), `floor-plan-frame-2400px.jpg` (visual reference for the floor-plan canvas in section 12.2).

**WARNING: three DIFFERENT files are all named `share-default-v1.jpg`** (in `files2/`, in `files2/.../wild_hills_logo_pack/`, and in `wild-hills-separated-assets/`; they have different sizes). The agent must open all three, pick the most polished one, and write the choice in `DECISIONS.md`. The owner can override it. Use the SVG files for the site. Use PNG logos only for emails (hosted at a public URL) and never use the 500KB PNGs in the page.

Logo usage rules:

- Never redraw, recolor, stretch, rotate, outline, or add effects to the logo.
- Light logo on ivory or white. Reversed logo on navy or photos with the navy overlay.
- Clear space around the full logo: at least the height of the "W" in the wordmark on every side. Minimum width: 140px for the full logo, 120px for the navbar logo, 24px for the symbol alone.
- The tagline "REAL ESTATE" is part of the full logo only. The navbar logo and the symbol never add it.

### 15.2 Photo mapping (source to output)

Output names are lowercase, hyphenated, ASCII only (the sources contain spaces, parentheses, capitals, and non-ASCII characters such as `Konyaaltı` and `Kahramanmaraş`; these must be renamed). Photos are exported as WebP, except the area cards (see below).

| Group | Source files | Output in `public/images/` |
|---|---|---|
| Egypt hero | `Egypt/Herosection/` (3 files: `pexels-mfbeki-36224723.jpg`, `pexels-mo-ismail-2130628-22643802.jpg`, `Sunset_at_north_coast_of_egypt (1).jpg`) | `egypt/hero/hero-01.webp` to `hero-03.webp` plus `hero-0N-portrait.webp` |
| Georgia hero | `gorgia/herosection/` (3 files) | `georgia/hero/hero-01..03.webp` plus portraits |
| Turkey hero | `turkey/HEROsection/` (3 files) | `turkey/hero/hero-01..03.webp` plus portraits |
| UAE hero | `uae/Herosection/` (3 files) | `uae/hero/hero-01..03.webp` plus portraits |
| Egypt cities | `Alex.jpg`, `newcairo.jpg`, `newcapital.jpg`, `Alamein_towers.png` (8.5 MB PNG, convert and resize), `cairo.jpg` | `egypt/cities/alexandria.webp`, `new-cairo.webp`, `new-capital.webp`, `north-coast.webp`, `cairo.webp` |
| Georgia cities | `Batumi.jpg`, `Tbilisi.jpg` | `georgia/cities/batumi.webp`, `tbilisi.webp` |
| Turkey cities | `Antalya.jpg`, `istanbul.jpg` | `turkey/cities/antalya.webp`, `istanbul.webp` |
| UAE cities | `abuhabi.jpg`, `dubai.jpg` | `uae/cities/abu-dhabi.webp`, `dubai.webp` |
| Area cards | `areacards/*.avif` (8 files, already small) | `{country}/areas/{area}.avif`, for example `georgia/areas/batumi-new-boulevard.avif`. KEEP AVIF as it is (do not re-compress). The agent logs each real width and height; any file narrower than 1000px is flagged in the gaps report. |
| Apartment samples | `wild_hills_apartment_default_images/` (cover plus 8 gallery images) | `defaults/apartment/cover.webp`, `cover-card.webp` (1200x900), `gallery-01..08.webp` |
| Villa samples | `wild_hills_villa_default_images/` (cover plus 8 gallery images) | `defaults/villa/cover.webp`, `cover-card.webp`, `gallery-01..08.webp` |
| Floor plan and map samples | `wild_hills_floorplan_and_map/` | `defaults/floor-plan-sample-2400.webp` and `-1200.webp`; `defaults/project-map-sample.webp` (1600x1000, under 120KB) |
| Blog covers | `wild_hills_sell_and_blog_images/blog-cover-01..03` | `blog/blog-cover-01..03.webp` (1200x800) |
| Sell with us | `sell-with-us.jpg` | `sell/sell-with-us.webp` (1400x1000) |
| Developer logos (placeholders) | `wild_hills_developer_logo_placeholders/*.svg` (10: nova, cedar, horizon, stone-co, meridian, solara, verdant, altura, bluehaven, crownline) | `developers/{name}.svg` (use the SVGs; ignore the PNGs). All are flagged `is_sample`. |

Portrait hero images (1200x1600) do not exist yet: generate them from each landscape hero with `sharp` using `position: sharp.strategy.attention`, and list them in the report so the owner can review the crops.

Special cases the agent must NOT guess:

- `turkey/cities/Kahramanmaraş.jpg` is a different city from Mersin (the featured Turkey city in section 1). Do NOT use it for Mersin. Skip it, list it as "unassigned" in the gaps report, and use a placeholder block for Mersin.
- Egypt needs six featured cards but only has photos for New Cairo, New Capital, Alexandria, and North Coast. For Sheikh Zayed and 6th of October (West Cairo) temporarily use `cairo.webp`, flagged `is_placeholder_image` in the manifest, until real photos are added.
- The area cards cover only 8 areas (Yas Island, Dubai Marina, Kadikoy, Konyaalti, Batumi New Boulevard, Vake, Fifth Settlement, North Coast). Other seeded areas use the clean navy-to-mist placeholder block from section 5.

### 15.3 Image budgets (the build script must enforce them and report any file over budget)

| Type | Size | Format | Max file size |
|---|---|---|---|
| Hero, landscape | 2400x1350 | WebP, quality about 72 | 300 KB |
| Hero, portrait | 1200x1600 | WebP, quality about 72 | 180 KB |
| City and area photo | 1000x750 | WebP (or the original AVIF) | 120 KB |
| Listing card cover | 1200x900 | WebP | 90 KB |
| Gallery photo | 2000 on the long edge | WebP, quality about 80 | 350 KB |
| Share card | 1200x630 | JPG or PNG | 150 KB |

Never upscale a small source image. If a source is smaller than its target size, keep its real size and flag it.

### 15.4 Gaps report (the agent writes `ASSETS_REPORT.md` at the end of Stage 2)

List every missing or unclear item and what was used instead. Known gaps right now:

| Missing | Temporary handling |
|---|---|
| Country chooser panels (4 tall images) | Crop from each country's first hero image |
| Portrait hero images | Generated crops (to be reviewed) |
| Mersin, Sheikh Zayed, 6th of October photos | Placeholder block or `cairo.webp` as listed above |
| Photos for areas other than the 8 area cards | Navy-to-mist placeholder with the symbol |
| Team portraits and office photo (About page) | Initials avatars and a placeholder block, flagged |
| Real developer logos | The 10 sample logos, labeled "Sample" |
| Real listing photos | Default apartment and villa galleries, labeled "Sample" |

### 15.5 Image credits and licenses

Several source files look like they came from Pexels, Unsplash, or Wikimedia (for example `pexels-...`, `Dubai_skyline_unsplash.jpg`, `Abu_Dhabi_Landscape.jpg`, `Modern_Istanbul_skyline.jpg`, `TR.AL.Antalya_...`). The agent must NOT assume the license terms. Create `public/images/CREDITS.md` with one row per photo: file, source (if known from the file name), license: "to verify". Add an "Image credits" page linked from the footer. The owner confirms each license before launch (see section 17). Never use stock images for the logo or for fake testimonials or fake team members.

### 15.6 Copy and tone

- Plain, calm, confident English. Short sentences. No hype words ("luxurious", "dream", "unbeatable"), no exclamation marks, no urgency tricks ("only 2 left!") unless the data is real.
- Arabic copy is written natively (not word-for-word translation) in Modern Standard Arabic with a warm, simple tone. Mark machine-drafted Arabic with `// TODO: native review` in the messages file.
- Every number, law, tax, fee, residency rule, or yield is a labeled placeholder (rule 11) until the legal team confirms.

---

## 16. Build stages (paste ONE prompt at a time)

How to use: give the agent this file, paste ONE stage below, review the result in the browser and in the code, then paste the next. Every stage inherits the rules in section 2 (lint, typecheck, build, commit, summary of at most 10 lines, then STOP). If a stage feels too big for the model, add: "Do the first half only." Then continue with "Do the second half."

### Stage 1: Project setup

```
Read WILD_HILLS_BUILD_SPEC.md sections 1 to 7. Do only Stage 1.
- Create the Next.js (App Router, TypeScript strict) project and the folder structure in section 3.
- Add Tailwind with the brand tokens from 4.1 as CSS variables, exposed in the Tailwind theme.
- Load fonts with next/font as in 4.2 (Lora, Inter, IBM Plex Sans Arabic).
- Set up next-intl: locales en and ar working, tr and ka scaffolded as empty files that fall back to English. Set html lang and dir correctly.
- Add middleware for locale handling and the wh_country and wh_locale cookies (section 6).
- Add .gitignore (include source-images and .env.local), .env.example (every key: Supabase URL, anon key, service role key, Resend, Turnstile site and secret, exchange-rate provider, SITE_URL, SITE_PRIVATE), DECISIONS.md, and scripts for lint, typecheck, and build.
- While SITE_PRIVATE=true, send noindex headers and robots noindex on every page.
Done when: lint, typecheck, and build pass, and /en and /ar both render an empty branded shell (ivory background, correct direction). Then stop.
```

### Stage 2: Assets and image pipeline

```
Read sections 2, 5, and 15. Do only Stage 2.
- Assume my prepared folder is already copied to ./source-images (never modify it).
- Copy the brand files and icons exactly as listed in 15.1. Open the three different share-default-v1.jpg files, choose the best one, and write the choice in DECISIONS.md.
- Write scripts/image-map.json and scripts/optimize-images.mjs (sharp) following 15.2 and 15.3. Rename files to lowercase ASCII names. Generate the portrait hero crops and the 4:3 card variants.
- Generate lib/image-manifest.ts with real width, height, and a tiny base64 blur placeholder for every output file.
- Build the PlaceholderImage component (navy-to-mist block with the Wild Hills symbol) and a small <SiteImage> wrapper around next/image that reads the manifest.
- Create public/images/CREDITS.md (licenses set to "to verify") and ASSETS_REPORT.md (the gaps report in 15.4, plus any file over budget).
Do NOT guess the Mersin photo or use Kahramanmaras for it. Done when: the script runs from a clean checkout and every output is within budget. Then stop.
```

### Stage 3: Design system and components

```
Read sections 2, 4, and 13. Do only Stage 3.
- Build every component in 4.4 using shadcn/ui primitives restyled to the brand (square-ish radii, thin borders, no heavy shadows).
- Use Lucide line icons (stroke 1.5). Use logical CSS properties.
- Build a dev-only /styleguide page that shows every component and state, in both English (ltr) and Arabic (rtl), including focus states.
- Add the motion helpers from 4.5 (reveal, counter, hover) with reduced-motion support.
Done when: the styleguide passes the section 13.8 automated check, no color is hard-coded outside the tokens, and the page does not look like a generic template. Then stop.
```

### Stage 4: Layout shell (navbar, footer, control, banners)

```
Read sections 2, 6, 7.3, 7.4, 8.1, the footer item in 8.3, and 13. Do only Stage 4.
- Navbar with the two states, hide-on-scroll-down, the Buy mega dropdown (data from placeholder constants for now), and the full-screen mobile menu (focus trap, Esc, scroll lock).
- The combined Country · Language · Currency control with cookies and URL changes.
- A currency provider that formats with Intl.NumberFormat. Use a small static rates object for now (the real rates come in Stage 5).
- The footer with a block per country (editable placeholder contacts), the cookie consent banner, the floating WhatsApp button, 404 and error pages.
- Arabic mirrors the whole layout.
Done when: the shell works on mobile, tablet, and desktop in both languages, and passes the keyboard test in 13.8. Then stop.
```

### Stage 5: Database, security, and sample data

```
Read sections 2, 7, 9.3, and 10. Do only Stage 5.
- Write the SQL migrations in supabase/migrations for every table in 10.1 (including favorites and saved_searches), the indexes in 9.3, pg_trgm and unaccent, the per-country reference sequences, and the price_usd and listing_count triggers.
- Write all Row Level Security policies in 10.2 and the audit_log triggers.
- Seed the locations in 7.1 with the featured pins from section 1 and 7.2, the 10 sample developers (is_sample), about 24 sample listings (6 per country, is_sample, using the default galleries), and sample posts, FAQs, guides, testimonials, and site_settings.
- Add the daily exchange-rate cron route (configurable provider, keep the last rates if the fetch fails) and replace the static rates from Stage 4.
- Write a script that tests the RLS rules with different roles (anonymous, publisher, staff, admin).
Ask before resetting any database. Done when: the RLS test script passes and the app reads seeded data. Then stop.
```

### Stage 6: Intro and country chooser

```
Read sections 2, 4.5, 8.2, 13.3, and 15. Do only Stage 6.
- Build the animated intro from wild-hills-symbol.svg as a React component (split the layers, draw the arch, then hills, cypress, towers, water, wordmark), about 2.5 seconds, skippable. Use intro-screen.png only as a visual reference. Content underneath renders at once so LCP is never blocked.
- Build the four-panel country chooser with the hover-expand behavior on desktop and stacked cards on mobile, using the panel images from Stage 2.
- Set the cookies, redirect returning visitors, keep server-rendered links to all four countries for crawlers.
Done when: the intro plays once per session, is skippable, respects reduced motion, and the chooser works by keyboard. Then stop.
```

### Stage 7: Country home

```
Read sections 2, 4, 7.2, 8.3, 13, and 15. Do only Stage 7, for all four countries from the same template.
- Build all 12 sections in 8.3 in order, with varied layout rhythm and alternating backgrounds.
- Hero slideshow with the first image priority, a visible pause button, gold progress line, portrait images on phones, and the search bar that rises in last.
- Featured locations from the database (Egypt: six cards under East Cairo, West Cairo, Coast labels), with listing counts and the "no listings here yet" state.
- Payment plan calculator, buying guide placeholders flagged "to be confirmed by our legal team", counters flagged as placeholders.
Done when: all four country homes render with real seeded data, look editorial (not a stack of identical cards), and meet the targets in 14.1. Then stop.
```

### Stage 8: Search and listings page

```
Read sections 2, 7.3, 8.4, 8.7, 9, and 13.5. Do only Stage 8.
- Smart search box (9.1), the filters (9.2), URL-based state, active filter chips, sorting, Grid and Map toggle (Leaflet loaded lazily), 12 results per page with server-rendered pagination, skeleton cards, and the empty state with the lead form.
- Do all filtering, sorting, and pagination in the database (9.3). Price filters use price_usd.
- ListingCard with badges, price in the chosen currency with the original beneath, favorite heart, and compare checkbox. Add the favorites page, compare tray and table, and the recently viewed row (8.7).
Done when: a shared search URL reproduces the same results, and no filtering happens in the browser. Then stop.
```

### Stage 9: Property page, leads, and share cards

```
Read sections 2, 8.5, 10.2 (leads), 10.3, 12.3, and 13. Do only Stage 9.
- Build the full property page in 8.5: gallery with focal points and lightbox, key facts with the sqm/sqft toggle, payment plan block and calculator, floor plan with the ZoomViewer, location (project map image or lazy Leaflet), developer and project block, agent card, similar listings, and the mobile sticky bar.
- Build the Request details and Book a viewing forms as server actions with Zod, Turnstile, rate limiting, and a consent checkbox. Save the lead and email the right country team through Resend.
- Build the WhatsApp button with the prefilled message in the visitor's language.
- Add JSON-LD, OpenGraph, and the opengraph-image.tsx share card exactly as in 12.3, including the cache-busting version and the Arabic fallback to share-ar-v1.jpg.
Done when: a lead created on the page appears in the database with the right country and source, and the share card renders in English and Arabic. Then stop.
```

### Stage 10: Remaining public pages

```
Read sections 2, 8.6, 8.7, 14.3, and 13. Do only Stage 10.
- City and area pages, projects and project detail, developers and developer detail, buying guides per country, blog list and posts, FAQ, About, Contact, Sell with us (form with the upload pipeline from 12.1 and the magic-link tracking email), Legal pages (placeholder text marked "requires legal review per country"), and the footer "Image credits" page.
- Add the SEO work in 14.3 for these pages: metadata, hreflang, canonical, JSON-LD, and sitemap entries.
Done when: every route in section 3 exists, has real seeded content, and is linked from the navigation or footer. Then stop.
```

### Stage 11: Admin foundation and listings

```
Read sections 2, 10, 11 (screens 1 to 4), 12.1, and 12.2. Do only Stage 11.
- /admin in English only, protected, mobile-friendly, noindex. Supabase Auth (magic link) with TOTP two-factor for staff and admin, and role checks in middleware and in RLS.
- Overview, Listings table with filters and bulk actions, and the listing form with all tabs.
- The upload pipeline (12.1): browser compression, size and count rules, drag to reorder, cover image, alt text, focal-point picker.
- Floor plan processing with sharp (12.2), including the reviewer warning and the project map upload.
- The review queue with the checklist and Approve, Request changes (with an emailed note), and Reject. Approve generates the reference number.
- The lifecycle and the 30 to 60 day re-confirmation with the reminder email 7 days before (nightly job).
Done when: a listing can go from submitted to published and appear on the public site with the right photos, plan, and share card. Then stop.
```

### Stage 12: Admin: leads, locations, content, users

```
Read sections 2, 7.2, and 11 (screens 5 to 10). Do only Stage 12.
- Locations manager (tree, pin and hide, rename, add a city request and approval, counts).
- Developers and projects (logo upload, payment plan builder, map image, distances list).
- Leads inbox with pipeline statuses, assignment, internal notes, filters, CSV export, and email alerts to the right country team.
- Content screens (blog, FAQ, guides, testimonials, hero headlines, counters, per-country contacts and license numbers), Users and roles (admin only, MFA prompts), and the Audit log viewer.
Done when: an editor can change a hero headline, a country phone number, and a featured location pin in the admin and see it on the public site without a developer. Then stop.
```

### Stage 13: Arabic, accessibility, SEO, and performance pass

```
Read sections 13 and 14. Do only Stage 13. Do not add features.
- Review every public page in /ar at mobile and desktop widths and fix direction, number, and spacing problems (13.7).
- Run the full checklist in 13.8 and fix every serious issue.
- Measure against 14.1 with Lighthouse (mobile) on the country home, /buy, and a property page. Fix what misses the targets (image sizes, dynamic imports, fonts, layout shift).
- Verify sitemaps, hreflang, canonical rules, and structured data (14.3).
Done when: you can paste a table of before and after scores and every target in 14.1 is met or has a written reason in DECISIONS.md. Then stop.
```

### Stage 14: QA, security review, and launch preparation

```
Read sections 10.3, 13.8, 14, and 17. Do only Stage 14.
- Run the security checklist in 10.3 line by line and report pass or fail. Confirm no secret appears in client code, the service-role key is server only, headers are set, and RLS tests still pass.
- Test the lead flow end to end for all four countries (form, spam protection, database, email, WhatsApp link).
- Test the main journeys on a real phone size: choose country, search, open a listing, request details, switch language and currency.
- Write LAUNCH_CHECKLIST.md using section 17, marking each item Done, Blocked, or Needs owner input.
Do not switch SITE_PRIVATE to false. Then stop.
```

---

## 17. Going public (checklist)

The site stays PRIVATE (noindex, free plans) until every item below is done. Only the owner switches it public.

### 17.1 Accounts and hosting

- Move Vercel and Supabase from the free plans to the paid plans before launch (the free plans are not meant for a public business site). Check current limits and prices on their pages at that time.
- Production and preview environments each have their own environment variables. The service-role key exists only on the server. Rotate any key that was ever pasted into a chat or a screenshot.
- Buy the domain and connect DNS. Redirect `www` and non-`www` to one version. HTTPS only, with HSTS.
- Verify the sending domain in Resend (SPF and DKIM) and send a test lead email to every country team.
- Create production Turnstile keys for the real domain.
- Turn on daily database backups and test a restore once. Set up error monitoring (for example Sentry) and uptime checks.

### 17.2 Content and legal (owner input required)

- Replace every placeholder: country phone numbers, WhatsApp numbers, emails, addresses, working hours, social links, license or registration numbers, counters, testimonials, team portraits, and the office photo.
- Replace sample listings, sample developers, and sample photos with real data, or keep them hidden. Nothing flagged `is_sample` or "Sample" is visible to the public at launch (unless the owner explicitly decides otherwise).
- Legal text (privacy, terms, cookies) reviewed by a lawyer for each country. Buying guides, fees, taxes, residency rules, and yields reviewed and confirmed by the legal team. Remove every "to be confirmed" flag only after that review.
- Confirm the license of every photo in `CREDITS.md` and complete the Image credits page. Replace any photo whose license is unclear.
- Arabic copy reviewed by a native speaker.
- Real exchange-rate provider key set and tested.

### 17.3 Final tests

- Lighthouse and the 13.8 checklist pass on the production URL.
- Share a property link in WhatsApp, Facebook, and X, in English and Arabic, and confirm the share card appears (then use the cache-busting version if an old card sticks).
- Submit one test lead of every source type and follow it through the inbox and the email alert.
- Test the cookie banner: analytics stay off until consent where required.
- Check `robots.txt`, `sitemap.xml`, and that `/admin` and `/api` are not indexed.

### 17.4 Switch on

1. Set `SITE_PRIVATE=false` and redeploy.
2. Submit the sitemaps in Google Search Console and Bing Webmaster Tools.
3. Watch error monitoring, lead emails, and Core Web Vitals daily for the first two weeks.
4. Keep `DECISIONS.md` and `LAUNCH_CHECKLIST.md` in the repository as the project's memory.
