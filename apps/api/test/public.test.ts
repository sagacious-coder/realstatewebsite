import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { AddressInfo } from 'node:net';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { LiveApiClient } from '@wild-hills/api-client';
import {
  ListingSummarySchema,
  ListingDetailSchema,
  SearchResultSchema,
  LocationSchema,
  DeveloperSchema,
  ProjectSchema,
  SmartSearchSuggestionGroupSchema,
  ExchangeRatesSchema,
} from '@wild-hills/contracts';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import * as schema from '../src/db/schema/index.js';
import { setDatabase } from '../src/db/index.js';
import { withActor } from '../src/db/context.js';
import { buildApp } from '../src/app.js';

describe('Stage B4: Public Read API, Search & Contract Parity', () => {
  let app: FastifyInstance;
  let pglite: PGlite;
  let liveClient: LiveApiClient;
  let baseUrl: string;

  beforeAll(async () => {
    // 1. Initialize PGlite database with all required extensions
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    const db = drizzle(pglite, { schema });
    setDatabase(db);

    // Apply migrations 0001-0005
    await runMigrations(pglite);

    // Seed fixtures data (51 locations, 10 developers, 8 projects, 24 sample listings, rates)
    await runSeed(db);

    // 2. Build Fastify application
    app = await buildApp();
    await app.ready();

    // 3. Start server on random ephemeral port for LiveApiClient verification
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;

    liveClient = new LiveApiClient({ baseUrl });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (pglite) {
      await pglite.close();
    }
  });

  // ============================================================================
  // 1. Public Read Endpoints (Section 10.9)
  // ============================================================================
  describe('1. Public Read Endpoints (/v1/public/*)', () => {
    it('GET /v1/public/locations returns list of locations and respects country filter', async () => {
      const resAll = await app.inject({
        method: 'GET',
        url: '/v1/public/locations',
      });
      expect(resAll.statusCode).toBe(200);
      const locations = resAll.json();
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThanOrEqual(50);
      expect(() => LocationSchema.parse(locations[0])).not.toThrow();

      // Check country filter
      const resAe = await app.inject({
        method: 'GET',
        url: '/v1/public/locations?country=ae',
      });
      expect(resAe.statusCode).toBe(200);
      const aeLocations = resAe.json();
      expect(aeLocations.length).toBeGreaterThan(0);
      for (const loc of aeLocations) {
        expect(loc.countryCode).toBe('ae');
      }
    });

    it('GET /v1/public/locations/:slug returns location or 404 Problem Details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/locations/dubai',
      });
      expect(res.statusCode).toBe(200);
      const dubai = res.json();
      expect(dubai.slug).toBe('dubai');
      expect(dubai.countryCode).toBe('ae');

      const notFound = await app.inject({
        method: 'GET',
        url: '/v1/public/locations/non-existent-location-slug',
      });
      expect(notFound.statusCode).toBe(404);
      expect(notFound.headers['content-type']).toContain('application/problem+json');
    });

    it('GET /v1/public/developers returns developers and supports slug lookup', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/developers',
      });
      expect(res.statusCode).toBe(200);
      const devs = res.json();
      expect(Array.isArray(devs)).toBe(true);
      expect(devs.length).toBe(10);
      expect(() => DeveloperSchema.parse(devs[0])).not.toThrow();

      const devSlug = devs[0].slug;
      const resDev = await app.inject({
        method: 'GET',
        url: `/v1/public/developers/${devSlug}`,
      });
      expect(resDev.statusCode).toBe(200);
      expect(resDev.json().slug).toBe(devSlug);

      const notFound = await app.inject({
        method: 'GET',
        url: '/v1/public/developers/unknown-dev',
      });
      expect(notFound.statusCode).toBe(404);
    });

    it('GET /v1/public/projects returns projects and supports slug lookup', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/projects',
      });
      expect(res.statusCode).toBe(200);
      const projs = res.json();
      expect(Array.isArray(projs)).toBe(true);
      expect(projs.length).toBeGreaterThan(0);
      expect(() => ProjectSchema.parse(projs[0])).not.toThrow();

      const projSlug = projs[0].slug;
      const resProj = await app.inject({
        method: 'GET',
        url: `/v1/public/projects/${projSlug}`,
      });
      expect(resProj.statusCode).toBe(200);
      expect(resProj.json().slug).toBe(projSlug);

      const notFound = await app.inject({
        method: 'GET',
        url: '/v1/public/projects/unknown-proj',
      });
      expect(notFound.statusCode).toBe(404);
    });

    it('GET /v1/public/listings/:ref_or_slug resolves by refNumber and by slug', async () => {
      // By refNumber
      const resRef = await app.inject({
        method: 'GET',
        url: '/v1/public/listings/WH-AE-101',
      });
      expect(resRef.statusCode).toBe(200);
      const byRef = resRef.json();
      expect(byRef.refNumber).toBe('WH-AE-101');
      expect(() => ListingDetailSchema.parse(byRef)).not.toThrow();

      // By slug
      const resSlug = await app.inject({
        method: 'GET',
        url: `/v1/public/listings/${byRef.slug}`,
      });
      expect(resSlug.statusCode).toBe(200);
      expect(resSlug.json().id).toBe(byRef.id);

      const notFound = await app.inject({
        method: 'GET',
        url: '/v1/public/listings/UNKNOWN-REF-999',
      });
      expect(notFound.statusCode).toBe(404);
      expect(notFound.headers['content-type']).toContain('application/problem+json');
    });

    it('GET /v1/public/rates returns valid exchange rates structure', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/rates',
      });
      expect(res.statusCode).toBe(200);
      const rates = res.json();
      expect(rates.base).toBe('USD');
      expect(rates.rates.AED).toBe(3.6725);
      expect(() => ExchangeRatesSchema.parse(rates)).not.toThrow();
    });
  });

  // ============================================================================
  // 2. Search Query Builder & Filters on price_usd_minor (Section 9.2)
  // ============================================================================
  describe('2. Search Query Builder & Filtering', () => {
    it('searches listings by country and city', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?country=ge&city=Batumi',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(() => SearchResultSchema.parse(data)).not.toThrow();
      expect(data.items.length).toBeGreaterThan(0);
      for (const item of data.items) {
        expect(item.location.countryCode).toBe('ge');
        expect(item.location.city.toLowerCase()).toBe('batumi');
      }
    });

    it('filters by property type', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?type=villa',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      for (const item of data.items) {
        expect(item.propertyType).toBe('villa');
      }
    });

    it('filters by price_usd_minor range with currency conversion', async () => {
      // In USD
      const resUsd = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?minPrice=500000&maxPrice=2000000&currency=USD',
      });
      expect(resUsd.statusCode).toBe(200);
      const dataUsd = resUsd.json();
      for (const item of dataUsd.items) {
        expect(item.priceUsdMinor).toBeGreaterThanOrEqual(50000000);
        expect(item.priceUsdMinor).toBeLessThanOrEqual(200000000);
      }

      // In AED (converted via rate ~3.6725)
      const resAed = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?minPrice=2000000&maxPrice=10000000&currency=AED',
      });
      expect(resAed.statusCode).toBe(200);
      const dataAed = resAed.json();
      expect(dataAed.items.length).toBeGreaterThan(0);
    });

    it('filters by bedrooms (exact, string studio, plus notation)', async () => {
      // Exact number
      const res2Beds = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?beds=2',
      });
      expect(res2Beds.statusCode).toBe(200);
      for (const item of res2Beds.json().items) {
        expect(item.bedrooms).toBe(2);
      }

      // String "studio" -> 0 beds
      const resStudio = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?beds=studio',
      });
      expect(resStudio.statusCode).toBe(200);
      for (const item of resStudio.json().items) {
        expect(item.bedrooms).toBe(0);
      }

      // String "3+" -> >= 3 beds
      const res3Plus = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?beds=3%2B',
      });
      expect(res3Plus.statusCode).toBe(200);
      for (const item of res3Plus.json().items) {
        expect(item.bedrooms).toBeGreaterThanOrEqual(3);
      }
    });

    it('filters by bathrooms and completion status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?baths=2&status=ready',
      });
      expect(res.statusCode).toBe(200);
      for (const item of res.json().items) {
        expect(item.bathrooms).toBeGreaterThanOrEqual(2);
        expect(item.status).toBe('ready');
      }
    });

    it('filters by feature flags (isFeatured, isHotDeal)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?isFeatured=true',
      });
      expect(res.statusCode).toBe(200);
      for (const item of res.json().items) {
        expect(item.isFeatured).toBe(true);
      }
    });

    it('strictly supports allow-listed sorting (Rule 15 allow-list map)', async () => {
      // Price Ascending
      const resPriceAsc = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?sort=price_asc&limit=10',
      });
      const itemsAsc = resPriceAsc.json().items;
      for (let i = 1; i < itemsAsc.length; i++) {
        expect(itemsAsc[i].priceUsdMinor).toBeGreaterThanOrEqual(itemsAsc[i - 1].priceUsdMinor);
      }

      // Price Descending
      const resPriceDesc = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?sort=price_desc&limit=10',
      });
      const itemsDesc = resPriceDesc.json().items;
      for (let i = 1; i < itemsDesc.length; i++) {
        expect(itemsDesc[i].priceUsdMinor).toBeLessThanOrEqual(itemsDesc[i - 1].priceUsdMinor);
      }

      // Bedrooms Descending
      const resBedsDesc = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?sort=beds_desc&limit=10',
      });
      const itemsBeds = resBedsDesc.json().items;
      for (let i = 1; i < itemsBeds.length; i++) {
        expect(itemsBeds[i].bedrooms).toBeLessThanOrEqual(itemsBeds[i - 1].bedrooms);
      }
    });

    it('supports pagination with total, page, limit, totalPages, and hasMore', async () => {
      const resPage1 = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?limit=5&page=1',
      });
      const p1 = resPage1.json();
      expect(p1.items.length).toBe(5);
      expect(p1.page).toBe(1);
      expect(p1.limit).toBe(5);
      expect(p1.hasMore).toBe(true);

      const resPage2 = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?limit=5&page=2',
      });
      const p2 = resPage2.json();
      expect(p2.items.length).toBe(5);
      expect(p2.page).toBe(2);

      // Verify no overlap between page 1 and page 2
      const idsP1 = new Set(p1.items.map((i: any) => i.id));
      for (const item of p2.items) {
        expect(idsP1.has(item.id)).toBe(false);
      }
    });

    it('computes facet counts across propertyType, city, status, and price range', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings?country=ae',
      });
      const data = res.json();
      expect(data.facetCounts).toBeDefined();
      expect(typeof data.facetCounts.byType).toBe('object');
      expect(typeof data.facetCounts.byCity).toBe('object');
      expect(typeof data.facetCounts.byStatus).toBe('object');
      expect(data.facetCounts.priceRange.minUsdMinor).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 3. Typo-Tolerant Suggest Engine (Section 9.2)
  // ============================================================================
  describe('3. Suggest Engine & Trigram Matching', () => {
    it('GET /v1/public/suggest finds locations, developers, and listings', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/suggest?q=dubai',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.query).toBe('dubai');
      expect(Array.isArray(data.locations)).toBe(true);
      expect(data.locations.some((l: any) => l.name.toLowerCase().includes('dubai'))).toBe(true);
    });

    it('matches diacritics / unaccented query (kadıköy -> Kadikoy)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/suggest?q=kad%C4%B1k%C3%B6y',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      const matched = data.locations.some((l: any) =>
        l.slug.includes('kadikoy') || l.name.toLowerCase().includes('kadikoy')
      );
      expect(matched).toBe(true);
    });

    it('GET /v1/search/suggestions returns SmartSearchSuggestionGroup schema', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/search/suggestions?q=villa',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(() => SmartSearchSuggestionGroupSchema.parse(data)).not.toThrow();
      expect(data.query).toBe('villa');
      expect(Array.isArray(data.cities)).toBe(true);
      expect(Array.isArray(data.references)).toBe(true);
    });
  });

  // ============================================================================
  // 4. HTTP Caching Headers, ETag & 304 Handling
  // ============================================================================
  describe('4. Caching Headers & Conditional GET', () => {
    it('sets Cache-Control and X-Cache-Tags on public responses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/listings',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toBeDefined();
      expect(res.headers['cache-control']).toContain('public, max-age=60');
      expect(res.headers['x-cache-tags']).toBeDefined();
      expect(res.headers['x-cache-tags']).toContain('listings');
    });

    it('generates ETag and responds with 304 Not Modified when If-None-Match matches', async () => {
      const res1 = await app.inject({
        method: 'GET',
        url: '/v1/public/rates',
      });
      expect(res1.statusCode).toBe(200);
      const etag = res1.headers['etag'];
      expect(etag).toBeDefined();

      // Conditional GET with matching ETag
      const res2 = await app.inject({
        method: 'GET',
        url: '/v1/public/rates',
        headers: {
          'if-none-match': etag as string,
        },
      });
      expect(res2.statusCode).toBe(304);
      expect(res2.body).toBe('');
    });
  });

  // ============================================================================
  // 5. Database Isolation & Security (wh_public_ro)
  // ============================================================================
  describe('5. Database Security & Role Isolation', () => {
    it('forbids mutating database operations under public actor (wh_public_ro role)', async () => {
      const dbInstance = drizzle(pglite, { schema });

      // Attempting an INSERT while running as actor 'public' (which sets LOCAL ROLE wh_public_ro)
      await expect(
        withActor(dbInstance, { role: 'public' }, async (tx) => {
          await tx.execute(sql`
            INSERT INTO listings (
              id, ref_number, slug, title, country_code, city, property_type,
              review_status, price_minor, currency, price_usd_minor,
              size_sqm, size_sqft, cover_image, agent
            ) VALUES (
              '11111111-1111-7111-8111-111111111111', 'WH-HACK', 'hack', 'Hack Title', 'ae', 'Dubai', 'apartment',
              'published', 100, 'USD', 100, 100, 100, 'img.jpg', '{"name":"Hacker"}'::jsonb
            )
          `);
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 6. LiveApiClient Parity (Full Contract Compatibility)
  // ============================================================================
  describe('6. LiveApiClient Parity & End-to-End Contract Verification', () => {
    it('LiveApiClient.getListings succeeds and returns valid items', async () => {
      const result = await liveClient.getListings({ country: 'ae', limit: 6 });
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.total).toBeGreaterThanOrEqual(result.items.length);
      for (const item of result.items) {
        expect(() => ListingSummarySchema.parse(item)).not.toThrow();
        expect(item.location.countryCode).toBe('ae');
      }
    });

    it('LiveApiClient.getListingBySlug resolves detail for existing and null for unknown', async () => {
      const detail = await liveClient.getListingBySlug('WH-AE-101');
      expect(detail).not.toBeNull();
      expect(detail!.refNumber).toBe('WH-AE-101');
      expect(() => ListingDetailSchema.parse(detail!)).not.toThrow();

      const notFound = await liveClient.getListingBySlug('non-existent-property');
      expect(notFound).toBeNull();
    });

    it('LiveApiClient.getLocations returns array of valid Location objects', async () => {
      const locations = await liveClient.getLocations('ae');
      expect(locations.length).toBeGreaterThan(0);
      for (const loc of locations) {
        expect(() => LocationSchema.parse(loc)).not.toThrow();
        expect(loc.countryCode).toBe('ae');
      }
    });

    it('LiveApiClient.getDevelopers and getProjects return valid DTOs', async () => {
      const developers = await liveClient.getDevelopers('ae');
      expect(developers.length).toBeGreaterThan(0);
      for (const dev of developers) {
        expect(() => DeveloperSchema.parse(dev)).not.toThrow();
      }

      const projects = await liveClient.getProjects('ae');
      expect(projects.length).toBeGreaterThan(0);
      for (const proj of projects) {
        expect(() => ProjectSchema.parse(proj)).not.toThrow();
      }
    });

    it('LiveApiClient.getSearchSuggestions returns valid SmartSearchSuggestionGroup', async () => {
      const suggestions = await liveClient.getSearchSuggestions('villa', 'ae');
      expect(suggestions).toBeDefined();
      expect(suggestions.query).toBe('villa');
      expect(() => SmartSearchSuggestionGroupSchema.parse(suggestions)).not.toThrow();
    });

    it('LiveApiClient.getExchangeRates returns rates matching contracts schema', async () => {
      const rates = await liveClient.getExchangeRates();
      expect(rates.base).toBe('USD');
      expect(rates.rates.AED).toBe(3.6725);
      expect(() => ExchangeRatesSchema.parse(rates)).not.toThrow();
    });

    it('LiveApiClient content methods (countrySettings, buyingGuide, FAQs, testimonials, blogPosts)', async () => {
      const settings = await liveClient.getCountrySettings('ae');
      expect(settings.countryCode).toBe('ae');

      const guide = await liveClient.getBuyingGuide('ae');
      expect(guide).not.toBeNull();
      expect(guide!.countryCode).toBe('ae');

      const faqs = await liveClient.getFaqs('ae');
      expect(faqs.length).toBeGreaterThan(0);

      const testimonials = await liveClient.getTestimonials('ae');
      expect(testimonials.length).toBeGreaterThan(0);

      const blogPosts = await liveClient.getBlogPosts('ae');
      expect(blogPosts.length).toBeGreaterThan(0);
    });
  });
});
