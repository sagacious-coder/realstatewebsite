# Assets Optimization and Gaps Report (Stage 2)

Generated automatically by `scripts/optimize-images.mjs` adhering strictly to WILD_HILLS_BUILD_SPEC.md Sections 5, 12, and 15.

---

## 1. Budget Audit Summary

- **Total assets processed:** 97
- **Assets over budget:** 0
✅ **Every output image strictly satisfies its defined size budget.**

### Budget Breakdown by Asset Type
| Asset Type | Target Budget | Actual Range | Status |
|---|---|---|---|
| Hero (landscape 2400x1350) | 300 KB | ~80 - 295 KB | ✅ Pass |
| Hero (portrait 1200x1600) | 180 KB | ~60 - 175 KB | ✅ Pass |
| Country panels (800x1400) | 180 KB | ~70 - 150 KB | ✅ Pass |
| City & Area photos (1000x750) | 120 KB | ~50 - 110 KB | ✅ Pass |
| Card covers (1200x900) | 90 KB | ~40 - 85 KB | ✅ Pass |
| Floor plan sample (2400px) | 250 KB | ~120 - 180 KB | ✅ Pass |
| Project map sample (1600x1000) | 120 KB | ~70 - 105 KB | ✅ Pass |
| Share card (1200x630) | 150 KB | ~44 KB | ✅ Pass |

---

## 2. Gaps and Known Exceptions Report (Section 15.4)

| Item | Resolution Applied | Status |
|---|---|---|
| **Country Chooser Panels** | Automatically cropped 800x1400 portraits from `hero-01` of each country (`panel-egypt`, `panel-georgia`, `panel-turkey`, `panel-uae`) | Generated & stored in `/public/images/panels/` |
| **Portrait Hero Crops** | Generated from each landscape hero via `sharp.strategy.attention` | Stored as `hero-0N-portrait.webp` for phone viewports |
| **Mersin Photo** | `turkey/cities/Kahramanmaraş.jpg` skipped per Section 15.2 (different city). Not guessed. | Mersin uses `<PlaceholderImage />` component |
| **West Cairo (Sheikh Zayed & 6th of October)** | Used `cairo.webp` temporarily, explicitly tagged `is_placeholder_image: true` in manifest | Temporary fallback awaiting real photos |
| **Non-card Seeded Areas** | Areas without one of the 8 dedicated AVIF cards use `<PlaceholderImage />` | Branded navy-to-mist block with arch symbol |
| **Sample Galleries (Apartment & Villa)** | Sample images kept at native resolution without upscaling per Section 15.3 | Tagged `is_sample: true` in manifest |
| **Developer Logos** | 10 sample SVGs copied and flagged | Tagged `is_sample: true` in manifest |

---

## 3. Notable Source Dimensions & Observations
- **turkey/cities/Kahramanmaraş.jpg**: unassigned — Different city from Mersin. Skipped per Section 15.2. Mersin uses PlaceholderImage component.
- **public/images/defaults/apartment/gallery-01.webp**: sample gallery image under 1000px — Kept native resolution 376x254 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-02.webp**: sample gallery image under 1000px — Kept native resolution 372x254 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-03.webp**: sample gallery image under 1000px — Kept native resolution 376x254 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-04.webp**: sample gallery image under 1000px — Kept native resolution 376x254 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-05.webp**: sample gallery image under 1000px — Kept native resolution 376x255 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-06.webp**: sample gallery image under 1000px — Kept native resolution 372x255 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-07.webp**: sample gallery image under 1000px — Kept native resolution 376x255 without upscaling per Section 15.3.
- **public/images/defaults/apartment/gallery-08.webp**: sample gallery image under 1000px — Kept native resolution 376x255 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-01.webp**: sample gallery image under 1000px — Kept native resolution 376x246 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-02.webp**: sample gallery image under 1000px — Kept native resolution 372x246 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-03.webp**: sample gallery image under 1000px — Kept native resolution 376x246 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-04.webp**: sample gallery image under 1000px — Kept native resolution 376x246 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-05.webp**: sample gallery image under 1000px — Kept native resolution 376x256 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-06.webp**: sample gallery image under 1000px — Kept native resolution 372x256 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-07.webp**: sample gallery image under 1000px — Kept native resolution 376x256 without upscaling per Section 15.3.
- **public/images/defaults/villa/gallery-08.webp**: sample gallery image under 1000px — Kept native resolution 376x256 without upscaling per Section 15.3.
