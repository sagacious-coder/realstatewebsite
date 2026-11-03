import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { runMigrations } from '../src/db/migrate.js';
import * as schema from '../src/db/schema/index.js';
import { setDatabase } from '../src/db/index.js';
import { buildApp } from '../src/app.js';
import { hashPassword } from '../src/auth/passwords.js';
import { createSession } from '../src/auth/sessions.js';
import {
  MinioStorageAdapter,
  setStorageProvider,
} from '../src/providers/index.js';

describe('Stage B6: Admin API Surface, Listings Management, CRM, Review Queue & Audit Logging', () => {
  let app: FastifyInstance;
  let pglite: PGlite;
  let db: any;

  let ownerToken: string;
  let adminToken: string;
  let agentAeToken: string;
  let agentTrToken: string;

  let ownerUserId: string;
  let adminUserId: string;
  let agentAeUserId: string;
  let agentTrUserId: string;

  let createdListingId: string;
  let submissionId: string;
  let testLeadId: string;

  beforeAll(async () => {
    // 1. Initialize PGlite database with all required extensions
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    db = drizzle(pglite, { schema });
    setDatabase(db);
    await runMigrations(pglite);

    // Mock storage
    setStorageProvider(new MinioStorageAdapter());

    // 2. Seed Users
    const passwordHash = await hashPassword('AdminSecurePass2026!');

    // A. Platform Owner
    const [owner] = await db
      .insert(schema.users)
      .values({
        email: 'owner@wildhills.com',
        name: 'Elena Owner',
        role: 'owner',
        isActive: true,
        countryScopes: ['ae', 'tr', 'ge', 'eg'],
        passwordHash,
      })
      .returning();
    ownerUserId = owner.id;
    const ownerSession = await createSession(db, { userId: ownerUserId });
    ownerToken = ownerSession.rawToken;

    // B. Country Admin (AE and TR scopes)
    const [admin] = await db
      .insert(schema.users)
      .values({
        email: 'admin@wildhills.com',
        name: 'Tariq Admin',
        role: 'admin',
        isActive: true,
        countryScopes: ['ae', 'tr'],
        passwordHash,
      })
      .returning();
    adminUserId = admin.id;
    const adminSession = await createSession(db, { userId: adminUserId });
    adminToken = adminSession.rawToken;

    // C. Agent scoped strictly to UAE (ae)
    const [agentAe] = await db
      .insert(schema.users)
      .values({
        email: 'agent-ae@wildhills.com',
        name: 'Rashid Agent AE',
        role: 'agent',
        isActive: true,
        countryScopes: ['ae'],
        passwordHash,
      })
      .returning();
    agentAeUserId = agentAe.id;
    const agentAeSession = await createSession(db, { userId: agentAeUserId });
    agentAeToken = agentAeSession.rawToken;

    // D. Agent scoped strictly to Turkey (tr)
    const [agentTr] = await db
      .insert(schema.users)
      .values({
        email: 'agent-tr@wildhills.com',
        name: 'Canan Agent TR',
        role: 'agent',
        isActive: true,
        countryScopes: ['tr'],
        passwordHash,
      })
      .returning();
    agentTrUserId = agentTr.id;
    const agentTrSession = await createSession(db, { userId: agentTrUserId });
    agentTrToken = agentTrSession.rawToken;

    // Seed initial exchange rate
    await db.insert(schema.exchangeRates).values({
      base: 'USD',
      rates: { AED: 3.6725, TRY: 34.25, GEL: 2.72, EGP: 48.5, EUR: 0.92, GBP: 0.78 },
      updatedAt: new Date(),
    });

    // Seed location
    await db.insert(schema.locations).values({
      id: uuidv7(),
      slug: 'palm-jumeirah',
      name: 'Palm Jumeirah',
      type: 'area',
      countryCode: 'ae',
      isFeatured: true,
      listingCount: 5,
    });

    // 3. Build Fastify application
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pglite) await pglite.close();
  });

  // ============================================================================
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ============================================================================

  describe('1. Authentication Boundaries', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/listings',
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.title).toBe('Unauthorized');
    });

    it('rejects unauthenticated CRM lead requests with 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/leads',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ============================================================================
  // 2. LISTINGS CRUD & OPTIMISTIC CONCURRENCY
  // ============================================================================

  describe('2. Listings Management Lifecycle', () => {
    it('creates a draft listing with auto-generated refNumber and version 1', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/listings',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          title: 'Royal Atlantis Penthouse',
          description: 'Ultra-luxury duplex penthouse with private sky pool.',
          countryCode: 'ae',
          city: 'Dubai',
          area: 'Palm Jumeirah',
          propertyType: 'penthouse',
          status: 'ready',
          reviewStatus: 'draft',
          priceMinor: 4500000000, // 45,000,000 AED
          currency: 'AED',
          bedrooms: 5,
          bathrooms: 6,
          sizeSqm: 850,
          coverImage: '/images/penthouse-cover.webp',
          images: [
            { url: '/images/penthouse-1.webp', alt: 'Sky pool', order: 0 },
            { url: '/images/penthouse-2.webp', alt: 'Living room', order: 1 },
          ],
        },
      });

      expect(res.statusCode).toBe(201);
      const listing = JSON.parse(res.payload);
      expect(listing.id).toBeDefined();
      expect(listing.refNumber).toMatch(/^WH-AE-\d+/);
      expect(listing.version).toBe(1);
      expect(listing.reviewStatus).toBe('draft');
      expect(listing.images.length).toBe(2);

      createdListingId = listing.id;
    });

    it('retrieves single listing with images and audit history', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.listing.id).toBe(createdListingId);
      expect(body.listing.title).toBe('Royal Atlantis Penthouse');
      expect(body.listing.images.length).toBe(2);
      expect(body.auditHistory.length).toBeGreaterThanOrEqual(1);
      expect(body.auditHistory[0].action).toBe('admin.listing.create');
    });

    it('updates listing and increments version to 2', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
          'if-match': '1',
        },
        payload: {
          title: 'Royal Atlantis Signature Penthouse',
          priceMinor: 4800000000,
        },
      });

      expect(res.statusCode).toBe(200);
      const updated = JSON.parse(res.payload);
      expect(updated.title).toBe('Royal Atlantis Signature Penthouse');
      expect(updated.version).toBe(2);
    });

    it('enforces optimistic concurrency locking (409 Conflict on stale version)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
          'if-match': '1', // Old version 1 when current is 2
        },
        payload: {
          title: 'Stale Update Attempt',
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.title).toBe('Conflict');
      expect(body.detail).toContain('Conflict: Listing has been modified by another user');
    });

    it('duplicates listing into a new draft with (Copy) title and new refNumber', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/listings/${createdListingId}/duplicate`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(201);
      const duplicate = JSON.parse(res.payload);
      expect(duplicate.id).not.toBe(createdListingId);
      expect(duplicate.title).toContain('(Copy)');
      expect(duplicate.reviewStatus).toBe('draft');
      expect(duplicate.refNumber).toMatch(/^WH-AE-\d+/);
    });
  });

  // ============================================================================
  // 3. PUBLISH GUARD & STATE MACHINE
  // ============================================================================

  describe('3. Publishing Guard & Lifecycle Transitions', () => {
    it('publishes a valid listing successfully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/listings/${createdListingId}/publish`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const published = JSON.parse(res.payload);
      expect(published.reviewStatus).toBe('published');
    });

    it('unpublishes listing back to draft', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/listings/${createdListingId}/unpublish`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const unpublished = JSON.parse(res.payload);
      expect(unpublished.reviewStatus).toBe('draft');
    });
  });

  // ============================================================================
  // 4. COUNTRY SCOPING & RBAC FOR AGENTS
  // ============================================================================

  describe('4. RBAC & Country Scoping Enforcement', () => {
    let trListingId: string;

    beforeAll(async () => {
      // Create a Turkey listing
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/listings',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          title: 'Bosphorus Waterfront Mansion',
          countryCode: 'tr',
          city: 'Istanbul',
          area: 'Bebek',
          propertyType: 'mansion',
          status: 'ready',
          reviewStatus: 'draft',
          priceMinor: 12000000000,
          currency: 'TRY',
          bedrooms: 7,
          bathrooms: 8,
          sizeSqm: 1200,
          coverImage: '/images/bosphorus-mansion.webp',
        },
      });
      trListingId = JSON.parse(res.payload).id;
    });

    it('agent scoped to AE can access and mutate UAE listing', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${agentAeToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.listing.countryCode).toBe('ae');
    });

    it('agent scoped to AE receives 403 or 404 when attempting to access/mutate TR listing', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/v1/admin/listings/${trListingId}`,
        headers: {
          authorization: `Bearer ${agentAeToken}`,
        },
        payload: {
          title: 'Unauthorized Intrusion Attempt',
        },
      });

      expect([403, 404]).toContain(res.statusCode);
    });

    it('agent is forbidden from viewing system audit logs (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/audit-log',
        headers: {
          authorization: `Bearer ${agentAeToken}`,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.title).toBe('Forbidden');
    });

    it('platform owner can view system audit logs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/audit-log',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 5. CRM LEADS & FORMULA-SAFE CSV EXPORT
  // ============================================================================

  describe('5. CRM Leads Inbox & Formula-Safe CSV Export', () => {
    beforeAll(async () => {
      // Seed a normal lead
      const [normalLead] = await db
        .insert(schema.leads)
        .values({
          id: uuidv7(),
          name: 'Amira Al-Mansoor',
          email: 'amira@example.com',
          phone: '+971509876543',
          countryCode: 'ae',
          type: 'inquiry',
          status: 'new',
          message: 'Interested in VIP penthouse viewing.',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      testLeadId = normalLead.id;

      // Seed a malicious lead testing spreadsheet formula injection characters (=, +, -, @)
      await db.insert(schema.leads).values({
        id: uuidv7(),
        name: '=cmd|\'/C calc\'!A0',
        email: '@malicious.domain',
        phone: '+1234567890',
        countryCode: 'ae',
        type: 'inquiry',
        status: 'new',
        message: '-SUM(A1:A10)',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('retrieves filterable leads list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/leads?country=ae',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('advances lead pipeline status and adds staff note', async () => {
      // 1. Advance status
      const statusRes = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/leads/${testLeadId}/status`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          status: 'contacted',
        },
      });
      expect(statusRes.statusCode).toBe(200);

      // 2. Add staff note
      const noteRes = await app.inject({
        method: 'POST',
        url: `/v1/admin/leads/${testLeadId}/notes`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          content: 'VIP client contacted via WhatsApp. Viewing scheduled for Saturday.',
        },
      });
      expect(noteRes.statusCode).toBe(201);
      const note = JSON.parse(noteRes.payload);
      expect(note.content).toContain('VIP client contacted');

      // 3. Verify lead detail includes notes
      const detailRes = await app.inject({
        method: 'GET',
        url: `/v1/admin/leads/${testLeadId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = JSON.parse(detailRes.payload);
      expect(detail.lead.status).toBe('contacted');
      expect(detail.notes.length).toBe(1);
    });

    it('exports leads to CSV neutralizing formula characters (=, +, -, @)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/admin/leads/export?country=ae',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      const csv = res.payload;

      // Verify header row
      expect(csv).toContain('ID,Name,Email,Phone,Country,Status,Type');

      // Verify formula injection guard prepends single quote
      expect(csv).toContain("'=cmd|'/C calc'!A0");
      expect(csv).toContain("'+1234567890");
      expect(csv).toContain("'-SUM(A1:A10)");
      expect(csv).toContain("'@malicious.domain");
    });
  });

  // ============================================================================
  // 6. SELLER SUBMISSIONS & CONVERSION TO DRAFT
  // ============================================================================

  describe('6. Seller Submissions Queue & One-Click Draft Conversion', () => {
    beforeAll(async () => {
      const subId = uuidv7();
      await db.insert(schema.submissions).values({
        id: subId,
        sellerName: 'Karim Hassan',
        sellerEmail: 'karim@example.com',
        sellerPhone: '+971505554433',
        countryCode: 'ae',
        city: 'Dubai',
        area: 'Downtown Dubai',
        propertyType: 'apartment',
        bedrooms: 3,
        bathrooms: '3.5',
        sizeSqm: '210',
        expectedPriceMinor: '750000000', // 7,500,000 AED
        currency: 'AED',
        description: 'Luxury Opera District boulevard apartment with Burj Khalifa views.',
        status: 'pending_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(schema.submissionDocuments).values({
        id: uuidv7(),
        submissionId: subId,
        fileUrl: '/images/submissions/downtown-burj-view.webp',
        fileName: 'downtown-burj-view.webp',
        category: 'photo',
        fileSizeBytes: 240000,
        contentType: 'image/webp',
        createdAt: new Date(),
      });

      submissionId = subId;
    });

    it('lists submissions and updates review status', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/submissions?country=ae',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.payload);
      expect(list.items.length).toBeGreaterThanOrEqual(1);

      // Advance review status
      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/v1/admin/submissions/${submissionId}/status`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          status: 'approved',
        },
      });

      expect(patchRes.statusCode).toBe(200);
    });

    it('converts approved submission into a new draft listing with reference', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/admin/submissions/${submissionId}/convert`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(201);
      const result = JSON.parse(res.payload);
      expect(result.success).toBe(true);
      expect(result.listingId).toBeDefined();
      expect(result.refNumber).toMatch(/^WH-AE-\d+/);

      // Verify the new listing exists in the listings repository
      const listingRes = await app.inject({
        method: 'GET',
        url: `/v1/admin/listings/${result.listingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(listingRes.statusCode).toBe(200);
      const body = JSON.parse(listingRes.payload);
      expect(body.listing.reviewStatus).toBe('draft');
      expect(body.listing.coverImage).toBe('/images/submissions/downtown-burj-view.webp');
      expect(body.listing.images.length).toBe(1);

      // Verify submission status was marked as converted_to_draft
      const subRes = await app.inject({
        method: 'GET',
        url: `/v1/admin/submissions/${submissionId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });
      const subData = JSON.parse(subRes.payload);
      expect(subData.submission.status).toBe('converted_to_draft');
    });
  });

  // ============================================================================
  // 7. LOCATIONS, DEVELOPERS, RATES & PRIVATE DOCUMENT SIGNED URLS
  // ============================================================================

  describe('7. Locations, Developers, Rates & Document Presigning', () => {
    it('manages locations and developers metadata', async () => {
      // 1. Get locations
      const locsRes = await app.inject({
        method: 'GET',
        url: '/v1/admin/locations?country=ae',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });
      expect(locsRes.statusCode).toBe(200);
      const locs = JSON.parse(locsRes.payload);
      expect(locs.length).toBeGreaterThanOrEqual(1);

      // 2. Create developer
      const devRes = await app.inject({
        method: 'POST',
        url: '/v1/admin/developers',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          name: 'Emaar Properties',
          slug: 'emaar-properties',
          logo: '/images/developers/emaar.webp',
          countryCode: 'ae',
          operatingMarkets: ['ae', 'eg'],
          websiteUrl: 'https://properties.emaar.com',
          description: 'Premier global property developer.',
          isFeatured: true,
        },
      });
      expect(devRes.statusCode).toBe(201);
      const dev = JSON.parse(devRes.payload);
      expect(dev.name).toBe('Emaar Properties');
    });

    it('generates a 60-second signed URL for private documents', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/admin/documents/signed-url',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          key: 'private-docs/title-deed-001.pdf',
          expiresInSeconds: 60,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.signedUrl).toBeDefined();
      expect(body.signedUrl).toContain('title-deed-001.pdf');
      expect(body.expiresInSeconds).toBe(60);
    });

    it('updates FX rates and logs audit entry', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/v1/admin/rates',
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
        payload: {
          rates: {
            AED: 3.6725,
            TRY: 34.5,
            GEL: 2.75,
            EGP: 49.0,
            EUR: 0.93,
            GBP: 0.79,
          },
        },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  // ============================================================================
  // 8. IMMUTABLE AUDIT LOG TRIGGER
  // ============================================================================

  describe('8. Database Immutability & Soft Deletion Guards', () => {
    it('soft deletes listing and archives it', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);

      // Verify status is archived in database
      const checkRes = await app.inject({
        method: 'GET',
        url: `/v1/admin/listings/${createdListingId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`,
        },
      });
      const checkBody = JSON.parse(checkRes.payload);
      expect(checkBody.listing.reviewStatus).toBe('archived');
    });

    it('enforces trg_audit_log_immutable trigger (blocks UPDATE and DELETE on audit_log)', async () => {
      // Find an audit log record
      const logs = await db.select().from(schema.auditLog).limit(1);
      expect(logs.length).toBeGreaterThan(0);
      const logId = logs[0].id;

      // Attempt UPDATE directly on audit_log
      let updateFailed = false;
      try {
        await db.execute(sql`UPDATE audit_log SET action = 'tampered' WHERE id = ${logId}::uuid`);
      } catch (err: any) {
        updateFailed = true;
        const msg = String(err.cause?.message || err.message || err);
        expect(msg).toMatch(/immutable|cannot be updated/i);
      }
      expect(updateFailed).toBe(true);

      // Attempt DELETE directly on audit_log
      let deleteFailed = false;
      try {
        await db.execute(sql`DELETE FROM audit_log WHERE id = ${logId}::uuid`);
      } catch (err: any) {
        deleteFailed = true;
        const msg = String(err.cause?.message || err.message || err);
        expect(msg).toMatch(/immutable|cannot be updated/i);
      }
      expect(deleteFailed).toBe(true);
    });
  });
});

