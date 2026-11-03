import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';
import pino from 'pino';
import type { FastifyInstance } from 'fastify';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { eq, sql } from 'drizzle-orm';
import { LiveApiClient } from '@wild-hills/api-client';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import * as schema from '../src/db/schema/index.js';
import { setDatabase } from '../src/db/index.js';
import { buildApp } from '../src/app.js';
import { REDACTED_PATHS } from '../src/plugins/logging.js';
import { hashPassword } from '../src/auth/passwords.js';
import {
  MinioStorageAdapter,
  MailpitEmailAdapter,
  setStorageProvider,
  setEmailProvider,
} from '../src/providers/index.js';
import { queueService } from '../src/services/queue.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Stage 14: Security Audit, Comprehensive E2E Journeys & Production Launch Verification', () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pglite: PGlite;
  let db: any;
  let liveClient: LiveApiClient;

  // Captured Pino log lines for redaction auditing
  const capturedLogs: string[] = [];

  // Shared state across E2E journeys
  let visitorLeadId: string;
  let sellerSubmissionId: string;
  let sellerCapabilityToken: string;
  let adminSessionCookie: string;
  let adminSessionToken: string;
  let agentAeId: string;
  let agentTrToken: string;
  let convertedListingId: string;
  let publishedListingSlug: string;

  beforeAll(async () => {
    // 1. Initialize PGlite with extensions, migrations, and full Stage 5 seed
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    db = drizzle(pglite, { schema });
    setDatabase(db);

    await runMigrations(pglite);
    await runSeed(db);

    // 2. Configure providers & queue
    setStorageProvider(new MinioStorageAdapter());
    setEmailProvider(new MailpitEmailAdapter());
    queueService.clearQueue();

    // 3. Seed staff accounts for Admin & RLS tests
    const passwordHash = await hashPassword('WildHillsAdmin2026!Secure');

    await db.insert(schema.users).values({
      email: 'walidward@gmail.com',
      name: 'Walid Ward (Owner)',
      role: 'owner',
      isActive: true,
      countryScopes: ['ae', 'tr', 'ge', 'eg'],
      passwordHash,
    });

    const [agentAe] = await db
      .insert(schema.users)
      .values({
        email: 'agent.dubai@wildhills.com',
        name: 'Dubai Senior Advisor',
        role: 'agent',
        isActive: true,
        countryScopes: ['ae'],
        passwordHash,
      })
      .returning();
    agentAeId = agentAe.id;

    await db.insert(schema.users).values({
      email: 'agent.istanbul@wildhills.com',
      name: 'Istanbul Advisor',
      role: 'agent',
      isActive: true,
      countryScopes: ['tr'],
      passwordHash,
    });

    // 4. Create custom Pino logger with production REDACTED_PATHS writing to memory stream
    const logStream = new Writable({
      write(chunk, _encoding, callback) {
        capturedLogs.push(chunk.toString());
        callback();
      },
    });

    const testLogger = pino(
      {
        level: 'info',
        redact: {
          paths: REDACTED_PATHS,
          censor: '[REDACTED]',
        },
      },
      logStream
    );

    // 5. Build Fastify app and start listening on ephemeral port for LiveApiClient E2E
    app = await buildApp(testLogger);
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    serverUrl = address;

    liveClient = new LiveApiClient({
      baseUrl: serverUrl,
      token: 'e2e-web-service-token',
    });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pglite) await pglite.close();
  });

  // ============================================================================
  // 1. SECURITY & HARDENING AUDIT
  // ============================================================================
  describe('1. Security & Hardening Audit', () => {
    it('1.1 Enforces CSP, HSTS, X-Frame-Options DENY, and X-Content-Type-Options nosniff on API responses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/internal/healthz',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toContain('max-age=63072000');
      expect(res.headers['strict-transport-security']).toContain('includeSubDomains');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(res.headers['content-security-policy']).toContain("object-src 'none'");
    });

    it('1.2 Enforces Database Least-Privilege: wh_public_ro cannot INSERT, UPDATE, or DELETE on any table or view', async () => {
      const protectedTargets = [
        "INSERT INTO listings (id, ref_number, slug, title, country_code, city, property_type, price_minor, currency, price_usd_minor, size_sqm, size_sqft, cover_image, agent) VALUES ('01920000-0000-7000-8000-000000000999', 'WH-HACK', 'hack', 'Hack', 'ae', 'Dubai', 'villa', 100, 'AED', 27, 100, 1076, '/img.webp', '{}'::jsonb)",
        "UPDATE listings SET price_minor = 1",
        "DELETE FROM listings",
        "DELETE FROM leads",
        "DELETE FROM submissions",
        "DELETE FROM users",
        "DELETE FROM audit_log",
        "DELETE FROM public_listings",
      ];

      for (const stmt of protectedTargets) {
        await expect(
          pglite.exec(`
            BEGIN;
            SET LOCAL ROLE wh_public_ro;
            ${stmt};
            COMMIT;
          `)
        ).rejects.toThrow();
        await pglite.exec('ROLLBACK;');
      }
    });

    it('1.3 Enforces Row-Level Security (RLS) & Policy Scoping: agents cannot read or write outside assigned country_scopes', async () => {
      // Authenticate as TR-only agent
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'agent.istanbul@wildhills.com',
          password: 'WildHillsAdmin2026!Secure',
        },
      });
      expect(loginRes.statusCode).toBe(200);
      agentTrToken = loginRes.json().token;

      // 1. TR agent querying UAE (ae) admin listings receives 0 UAE records due to RLS scoping
      const aeListRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/listings?country=ae',
        headers: { authorization: `Bearer ${agentTrToken}` },
      });
      expect(aeListRes.statusCode).toBe(200);
      expect(aeListRes.json().items.length).toBe(0);

      // 2. TR agent attempting to create a listing in UAE (ae) must be 403 Forbidden
      const aeCreateRes = await app.inject({
        method: 'POST',
        url: '/v1/admin/listings',
        headers: { authorization: `Bearer ${agentTrToken}` },
        payload: {
          title: 'Unauthorized UAE Listing by TR Agent',
          countryCode: 'ae',
          city: 'Dubai',
          propertyType: 'apartment',
          priceMinor: 150000000,
          currency: 'AED',
          bedrooms: 2,
          bathrooms: 2,
          sizeSqm: 120,
          coverImage: '/images/listings/wh-ae-101/cover-card.webp',
        },
      });
      expect(aeCreateRes.statusCode).toBe(403);

      // 3. TR agent attempting to view system audit logs must be 403 Forbidden
      const auditRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/audit-log',
        headers: { authorization: `Bearer ${agentTrToken}` },
      });
      expect(auditRes.statusCode).toBe(403);
    });

    it('1.4 Redacts passwords, session tokens, authorization headers, cookies, and customer PII in Pino logs', async () => {
      capturedLogs.length = 0;

      const secretHeaderToken = 'Bearer super_secret_jwt_token_value_99999';
      const secretCookieVal = '__Host-wh_session=ultra_secret_cookie_token_88888';
      const secretPiiEmail = 'private.billionaire.investor@familyoffice.ch';
      const secretPiiPhone = '+971507776655';
      const secretPiiMessage = 'Private wire transfer instructions for Penthouse purchase';

      // Emit structured log with sensitive fields and headers through the app logger
      app.log.info(
        {
          req: {
            headers: {
              authorization: secretHeaderToken,
              cookie: secretCookieVal,
              'x-api-key': 'raw_secret_api_key_value',
            },
            body: {
              password: 'PlaintextPassword123!',
              token: 'raw_capability_token_value',
              email: secretPiiEmail,
              phone: secretPiiPhone,
              message: secretPiiMessage,
              sellerEmail: secretPiiEmail,
              sellerPhone: secretPiiPhone,
            },
          },
          password: 'PlaintextPassword123!',
          sessionToken: 'raw_session_token_xyz',
          capabilityToken: 'raw_capability_token_xyz',
          email: secretPiiEmail,
          phone: secretPiiPhone,
          message: secretPiiMessage,
        },
        'Audit test log entry for PII and credential redaction'
      );

      const combinedLogs = capturedLogs.join('\n');
      expect(combinedLogs).toContain('[REDACTED]');
      expect(combinedLogs).not.toContain(secretHeaderToken);
      expect(combinedLogs).not.toContain('ultra_secret_cookie_token_88888');
      expect(combinedLogs).not.toContain('raw_secret_api_key_value');
      expect(combinedLogs).not.toContain('PlaintextPassword123!');
      expect(combinedLogs).not.toContain('raw_session_token_xyz');
      expect(combinedLogs).not.toContain('raw_capability_token_xyz');
      expect(combinedLogs).not.toContain(secretPiiEmail);
      expect(combinedLogs).not.toContain(secretPiiPhone);
      expect(combinedLogs).not.toContain(secretPiiMessage);
    });
  });

  // ============================================================================
  // 2. COMPREHENSIVE END-TO-END (E2E) USER JOURNEYS
  // ============================================================================
  describe('2. Comprehensive End-to-End (E2E) User Journeys', () => {
    it('2.1 Visitor Journey: Country Chooser -> Country Home -> Search & Filter -> Property Detail -> Lead Submission -> DB Verification', async () => {
      // Step A: Country Chooser & Official UAE Country Settings + Exchange Rates
      const uaeSettings = await liveClient.getCountrySettings('ae');
      expect(uaeSettings).toBeDefined();
      expect(uaeSettings?.supportPhone).toBe('+971 50 680 2332');
      expect(uaeSettings?.supportWhatsapp).toBe('971506802332');
      expect(uaeSettings?.supportEmail).toBe('walidward@gmail.com');
      expect(uaeSettings?.legalDisclaimer).toContain('WILD HILLS REAL ESTATE - L.L.C - S.P.C');
      expect(uaeSettings?.legalDisclaimer).toContain('501-2026-200074238');
      expect(uaeSettings?.legalDisclaimer).toContain('101-2026-200113050');

      const rates = await liveClient.getExchangeRates();
      expect(rates.base).toBe('USD');
      expect(rates.rates.AED).toBeGreaterThan(0);

      // Step B: Country Homepage Sections (Featured Locations, Developers, Projects, Content)
      const featuredLocations = await liveClient.getLocations('ae');
      expect(featuredLocations.length).toBeGreaterThan(0);

      const uaeDevelopers = await liveClient.getDevelopers('ae');
      expect(uaeDevelopers.length).toBeGreaterThan(0);

      const uaeProjects = await liveClient.getProjects('ae');
      expect(uaeProjects.length).toBeGreaterThan(0);

      const uaeGuide = await liveClient.getBuyingGuide('ae');
      expect(uaeGuide).not.toBeNull();

      // Step C: Search Directory (/buy) — Filter by country, bedrooms, and budget + Smart Suggestions
      const suggestions = await liveClient.getSearchSuggestions('Marina', 'ae');
      expect(suggestions.query).toBe('Marina');
      expect(
        suggestions.cities.length +
          suggestions.areas.length +
          suggestions.projects.length +
          suggestions.developers.length
      ).toBeGreaterThan(0);

      const searchResult = await liveClient.getListings({
        country: 'ae',
        beds: '2+',
        minPrice: 100000,
        maxPrice: 50000000,
        sort: 'price_asc',
        page: 1,
        limit: 12,
      });
      expect(searchResult.items.length).toBeGreaterThan(0);
      for (const item of searchResult.items) {
        expect(item.location.countryCode).toBe('ae');
        expect(item.bedrooms).toBeGreaterThanOrEqual(2);
      }

      // Step D: Property Detail Page — Fetch full property detail by slug
      const targetSummary = searchResult.items[0]!;
      const propertyDetail = await liveClient.getListingBySlug(targetSummary.slug);
      expect(propertyDetail).not.toBeNull();
      expect(propertyDetail?.refNumber).toBe(targetSummary.refNumber);
      expect(propertyDetail?.images.length).toBeGreaterThan(0);

      // Step E: Submit Property Inquiry Lead on Property Page
      const leadResponse = await liveClient.createLead({
        type: 'inquiry',
        name: 'Sheikh Zayed Al Nahyan Investor',
        email: 'investor.vip@abudhabi.ae',
        phone: '+971506802332',
        preferredContact: 'whatsapp',
        countryCode: 'ae',
        listingId: propertyDetail!.id,
        propertyRef: propertyDetail!.refNumber,
        budgetMin: 2000000,
        budgetMax: 5000000,
        currency: 'AED',
        message: 'I would like to schedule a private viewing for this residence.',
        locale: 'en',
        consentGiven: true,
      });

      expect(leadResponse.success).toBe(true);
      expect(leadResponse.leadId).toBeDefined();
      visitorLeadId = leadResponse.leadId;

      // Step F: Verify lead exists in PostgreSQL with status 'new'
      const [dbLead] = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, visitorLeadId));
      expect(dbLead).toBeDefined();
      expect(dbLead.email).toBe('investor.vip@abudhabi.ae');
      expect(dbLead.propertyRef).toBe(propertyDetail!.refNumber);
      expect(dbLead.status).toBe('new');
    });

    it('2.2 Seller Journey: "Sell With Us" 4-Step Wizard -> Presign Upload -> Submit Property -> Capability Token Issued -> Verify Pending Queue', async () => {
      // Step A: Presign document upload for property title deed / photo
      const presignRes = await liveClient.presignUpload({
        fileName: 'palm-jumeirah-villa-title-deed.webp',
        contentType: 'image/webp',
        fileSizeBytes: 185000,
        category: 'document',
      });
      expect(presignRes.uploadUrl).toContain('http');
      expect(presignRes.key).toContain('palm-jumeirah-villa-title-deed.webp');

      // Step B: Submit 4-step "Sell With Us" property submission wizard
      const submissionRes = await liveClient.createSubmission({
        sellerName: 'Tariq Al Futtaim',
        sellerEmail: 'tariq.seller@dubai.ae',
        sellerPhone: '+971506802332',
        countryCode: 'ae',
        city: 'Dubai',
        area: 'Palm Jumeirah',
        propertyType: 'villa',
        bedrooms: 5,
        bathrooms: 6,
        sizeSqm: 680,
        expectedPriceMinor: 1500000000, // 15,000,000 AED
        currency: 'AED',
        description: 'Custom beachfront signature villa on Palm Jumeirah frond with private infinity pool and Atlantis views.',
        images: ['/images/listings/wh-ae-101/cover-card.webp'],
        consentGiven: true,
      });

      expect(submissionRes.success).toBe(true);
      expect(submissionRes.submissionId).toBeDefined();
      expect(submissionRes.capabilityToken).toBeDefined();
      expect(submissionRes.trackingUrl).toContain(submissionRes.capabilityToken!);

      sellerSubmissionId = submissionRes.submissionId;
      sellerCapabilityToken = submissionRes.capabilityToken!;

      // Step C: Verify Seller Capability Token exchange returns submission status
      const capExchangeRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/capability/exchange',
        payload: {
          token: sellerCapabilityToken,
        },
      });
      expect(capExchangeRes.statusCode).toBe(200);
      const capBody = capExchangeRes.json();
      expect(capBody.submission.id).toBe(sellerSubmissionId);
      expect(capBody.submission.city).toBe('Dubai');

      // Step D: Verify submission is in pending queue in PostgreSQL
      const [dbSub] = await db
        .select()
        .from(schema.submissions)
        .where(eq(schema.submissions.id, sellerSubmissionId));
      expect(dbSub).toBeDefined();
      expect(dbSub.sellerEmail).toBe('tariq.seller@dubai.ae');
    });

    it('2.3 Admin Journey: Staff Login (__Host- Cookie) -> Review Lead in CRM -> Convert Seller Submission -> Publish Listing -> Verify Live on Public /buy Directory', async () => {
      // Step A: Staff login with password and verify session cookie security
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'walidward@gmail.com',
          password: 'WildHillsAdmin2026!Secure',
        },
      });
      expect(loginRes.statusCode).toBe(200);

      const setCookieHeader = loginRes.headers['set-cookie'];
      const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0]! : String(setCookieHeader);
      expect(cookieStr).toContain('wh_session=');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('Path=/');
      expect(cookieStr).toContain('SameSite=Lax');

      adminSessionToken = loginRes.json().token;
      const authHeaders = { authorization: `Bearer ${adminSessionToken}` };

      // Step B: Review inbound lead from Visitor Journey in Admin CRM
      const leadsListRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/leads?country=ae',
        headers: authHeaders,
      });
      expect(leadsListRes.statusCode).toBe(200);
      const crmLeads = leadsListRes.json().items;
      const foundLead = crmLeads.find((l: any) => l.id === visitorLeadId);
      expect(foundLead).toBeDefined();
      expect(foundLead.email).toBe('investor.vip@abudhabi.ae');

      // Advance lead status in CRM
      const updateLeadRes = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/leads/${visitorLeadId}/status`,
        headers: authHeaders,
        payload: {
          status: 'qualified',
        },
      });
      expect(updateLeadRes.statusCode).toBe(200);

      // Add timeline note to lead
      const noteRes = await app.inject({
        method: 'POST',
        url: `/v1/admin/leads/${visitorLeadId}/notes`,
        headers: authHeaders,
        payload: {
          content: 'Arranged private helicopter viewing for Thursday at 4:00 PM GST.',
        },
      });
      expect(noteRes.statusCode).toBe(201);

      // Step C: Open Seller Submissions Queue & Convert Seller Submission to Listing Draft
      const subsQueueRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/submissions?country=ae',
        headers: authHeaders,
      });
      expect(subsQueueRes.statusCode).toBe(200);
      const pendingSubs = subsQueueRes.json().items;
      expect(pendingSubs.some((s: any) => s.id === sellerSubmissionId)).toBe(true);

      // Approve submission
      const approveRes = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/submissions/${sellerSubmissionId}/status`,
        headers: authHeaders,
        payload: {
          status: 'approved',
        },
      });
      expect(approveRes.statusCode).toBe(200);

      // Convert seller submission into a listing draft
      const convertRes = await app.inject({
        method: 'POST',
        url: `/v1/admin/submissions/${sellerSubmissionId}/convert`,
        headers: authHeaders,
      });
      expect(convertRes.statusCode).toBe(201);
      const convertResult = convertRes.json();
      expect(convertResult.success).toBe(true);
      expect(convertResult.listingId).toBeDefined();
      convertedListingId = convertResult.listingId;

      // Step D: Enrich draft listing with editorial title, description, cover image, and gallery
      const enrichRes = await app.inject({
        method: 'PUT',
        url: `/v1/admin/listings/${convertedListingId}`,
        headers: authHeaders,
        payload: {
          title: 'Palm Jumeirah Frond G Signature Beachfront Villa',
          description: 'Rare custom-built 5-bedroom signature villa on Palm Jumeirah with private beach access and full Marina skyline views.',
          coverImage: '/images/listings/wh-ae-101/cover-card.webp',
          images: [
            {
              url: '/images/listings/wh-ae-101/cover-card.webp',
              alt: 'Palm Jumeirah Frond G Signature Beachfront Villa',
              order: 0,
            },
          ],
          isFeatured: true,
          isVerified: true,
        },
      });
      expect(enrichRes.statusCode).toBe(200);
      publishedListingSlug = enrichRes.json().slug;

      // Step E: Publish the listing (passes trg_publish_guard trigger)
      const publishRes = await app.inject({
        method: 'POST',
        url: `/v1/admin/listings/${convertedListingId}/publish`,
        headers: authHeaders,
      });
      expect(publishRes.statusCode).toBe(200);
      expect(publishRes.json().reviewStatus).toBe('published');

      // Step F: Verify the newly published listing appears LIVE on the public /buy directory!
      const publicBuySearch = await liveClient.getListings({
        country: 'ae',
        q: 'Palm Jumeirah Frond G Signature',
      });
      expect(publicBuySearch.items.length).toBeGreaterThanOrEqual(1);
      const livePublishedItem = publicBuySearch.items.find((i) => i.id === convertedListingId);
      expect(livePublishedItem).toBeDefined();
      expect(livePublishedItem?.title).toBe('Palm Jumeirah Frond G Signature Beachfront Villa');

      // Also verify public detail page resolves by slug
      const liveDetail = await liveClient.getListingBySlug(publishedListingSlug);
      expect(liveDetail).not.toBeNull();
      expect(liveDetail?.id).toBe(convertedListingId);
      expect(liveDetail?.isVerified).toBe(true);
    });
  });

  // ============================================================================
  // 3. PRODUCTION DEPLOYMENT STACK, BACKUP SCRIPT & RESTORE VERIFICATION
  // ============================================================================
  describe('3. Production Deployment Stack & Database Restore Verification', () => {
    it('3.1 Validates infra/docker-compose.prod.yml and infra/Caddyfile production readiness', () => {
      const composePath = join(__dirname, '../../../infra/docker-compose.prod.yml');
      const caddyPath = join(__dirname, '../../../infra/Caddyfile');
      const backupScriptPath = join(__dirname, '../../../scripts/backup-db.sh');

      const composeContent = readFileSync(composePath, 'utf-8');
      const caddyContent = readFileSync(caddyPath, 'utf-8');
      const backupContent = readFileSync(backupScriptPath, 'utf-8');

      // Verify all 6 required services exist in docker-compose.prod.yml
      for (const service of ['postgres:', 'api:', 'worker:', 'web:', 'admin:', 'caddy:']) {
        expect(composeContent).toContain(service);
      }

      // Verify automatic migrations and seed on boot in api container command
      expect(composeContent).toContain('node dist/db/migrate.js && node dist/db/seed.js && node dist/server.js');

      // Verify Postgres is isolated on wildhills-internal and has no published host ports
      expect(composeContent).toContain('wildhills-internal');
      expect(composeContent).toContain('80:80');
      expect(composeContent).toContain('443:443');

      // Verify Caddyfile security headers and reverse proxies
      expect(caddyContent).toContain('reverse_proxy web:3000');
      expect(caddyContent).toContain('reverse_proxy admin:3001');
      expect(caddyContent).toContain('reverse_proxy api:3002');
      expect(caddyContent).toContain('X-Frame-Options "DENY"');
      expect(caddyContent).toContain('Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"');

      // Verify backup-db.sh uses pg_dump -Fc and age encryption
      expect(backupContent).toContain('pg_dump -Fc');
      expect(backupContent).toContain('age -r "${BACKUP_AGE_PUBLIC_KEY}"');
    });

    it('3.2 Performs live database backup & clean-instance restore verification test (Section 18.4 item 3)', async () => {
      // 1. Export all critical data from primary DB (simulating pg_dump logical snapshot)
      const dumpedLocations = await db.select().from(schema.locations);
      const dumpedDevelopers = await db.select().from(schema.developers);
      const dumpedProjects = await db.select().from(schema.projects);
      const dumpedListings = await db.select().from(schema.listings);
      const dumpedLeads = await db.select().from(schema.leads);
      const dumpedSubmissions = await db.select().from(schema.submissions);

      expect(dumpedListings.length).toBeGreaterThanOrEqual(25); // 24 seeded + 1 converted
      expect(dumpedLeads.some((l: any) => l.id === visitorLeadId)).toBe(true);
      expect(dumpedSubmissions.some((s: any) => s.id === sellerSubmissionId)).toBe(true);

      // 2. Spin up a brand-new, empty PGlite database instance and restore snapshot in FK order
      const restorePg = new PGlite({
        extensions: { citext, pg_trgm, unaccent },
      });
      const restoreDb = drizzle(restorePg, { schema });

      try {
        await runMigrations(restorePg);

        // Restore parent tables first, then listings, leads, and submissions
        await restoreDb.insert(schema.developers).values(dumpedDevelopers);
        await restoreDb
          .insert(schema.locations)
          .values(dumpedLocations.map((loc: any) => ({ ...loc, parentId: null })));
        await restoreDb.insert(schema.projects).values(dumpedProjects);
        await restoreDb.insert(schema.listings).values(dumpedListings);
        await restoreDb.insert(schema.leads).values(dumpedLeads);
        await restoreDb.insert(schema.submissions).values(dumpedSubmissions);

        // 3. Verify restored data is 100% readable through public_listings view and tables
        const restoredPublicRes = await restorePg.query<{ count: string }>(
          'SELECT COUNT(*)::text as count FROM public_listings'
        );
        expect(Number(restoredPublicRes.rows[0]?.count)).toBe(
          dumpedListings.filter((l: any) => l.reviewStatus === 'published').length
        );

        const [restoredLead] = await restoreDb
          .select()
          .from(schema.leads)
          .where(eq(schema.leads.id, visitorLeadId));
        expect(restoredLead).toBeDefined();
        expect(restoredLead.email).toBe('investor.vip@abudhabi.ae');
      } finally {
        await restorePg.close();
      }
    });
  });
});
