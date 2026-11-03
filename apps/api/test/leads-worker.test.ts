import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import sharp from 'sharp';
import { runMigrations } from '../src/db/migrate.js';
import * as schema from '../src/db/schema/index.js';
import { setDatabase } from '../src/db/index.js';
import { buildApp } from '../src/app.js';
import {
  MailpitEmailAdapter,
  MinioStorageAdapter,
  setEmailProvider,
  setStorageProvider,
  getEmailProvider,
  getStorageProvider,
} from '../src/providers/index.js';
import { leadsRepository } from '../src/repositories/leads.repository.js';
import { submissionsRepository } from '../src/repositories/submissions.repository.js';
import { usageRepository } from '../src/repositories/usage.repository.js';
import { quotaService } from '../src/services/quota.service.js';
import { queueService } from '../src/services/queue.service.js';
import { workerService } from '../src/services/worker.service.js';
import { verifyCapabilityToken } from '../src/auth/capability.js';

describe('Stage B5: Leads, Submissions, Storage & Worker Engine', () => {
  let app: FastifyInstance;
  let pglite: PGlite;
  let mockEmail: MailpitEmailAdapter;
  let mockStorage: MinioStorageAdapter;

  beforeAll(async () => {
    // 1. Initialize PGlite database with all required extensions
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    const db = drizzle(pglite, { schema });
    setDatabase(db);

    // Apply all migrations (0001 - 0006)
    await runMigrations(pglite);

    // Set mock providers
    mockEmail = new MailpitEmailAdapter();
    mockStorage = new MinioStorageAdapter();
    setEmailProvider(mockEmail);
    setStorageProvider(mockStorage);

    // 2. Build Fastify application
    app = await buildApp();
    await app.ready();
  });

  beforeEach(() => {
    queueService.clearQueue();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pglite) await pglite.close();
  });

  describe('1. Inbound Leads Intake (POST /v1/public/leads & /v1/leads)', () => {
    const validLeadPayload = {
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+971501234567',
      countryCode: 'ae',
      type: 'inquiry',
      propertyRef: 'WH-AE-101',
      budgetMin: 5000000,
      budgetMax: 10000000,
      currency: 'AED',
      message: 'Interested in scheduling a private viewing for this penthouse.',
      locale: 'en',
      preferredContact: 'whatsapp',
      consentGiven: true,
    };

    it('successfully captures lead, persists to DB, and enqueues lead.intake job', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/leads',
        payload: validLeadPayload,
        headers: {
          'idempotency-key': 'lead-idemp-001',
          'cf-turnstile-response': '1x00000000000000000000AA', // Dummy valid token
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.leadId).toBeDefined();

      // Verify persistence in DB
      const lead = await leadsRepository.findLeadById(body.leadId);
      expect(lead).not.toBeNull();
      expect(lead?.email).toBe('elena.rostova@example.com');
      expect(lead?.status).toBe('new');

      // Verify worker job was dispatched
      const queued = queueService.getQueuedJobs('lead.intake');
      expect(queued.length).toBeGreaterThanOrEqual(1);
      expect(queued[0]?.data.leadId).toBe(body.leadId);
    });

    it('enforces idempotency: repeated request with same Idempotency-Key returns previous result without duplicate', async () => {
      const firstRes = await app.inject({
        method: 'POST',
        url: '/v1/leads',
        payload: {
          ...validLeadPayload,
          email: 'idemp.test@example.com',
        },
        headers: {
          'idempotency-key': 'idemp-duplicate-test',
        },
      });

      expect(firstRes.statusCode).toBe(201);
      const firstBody = JSON.parse(firstRes.payload);

      // Repeat request
      const secondRes = await app.inject({
        method: 'POST',
        url: '/v1/leads',
        payload: {
          ...validLeadPayload,
          email: 'idemp.test@example.com',
        },
        headers: {
          'idempotency-key': 'idemp-duplicate-test',
        },
      });

      expect(secondRes.statusCode).toBe(201);
      const secondBody = JSON.parse(secondRes.payload);
      expect(secondBody.leadId).toBe(firstBody.leadId);
    });

    it('rejects failed Turnstile captcha with 400 Bad Request Problem Details', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/leads',
        payload: validLeadPayload,
        headers: {
          'cf-turnstile-response': '2x00000000000000000000AB', // Explicit fail token
        },
      });

      expect(response.statusCode).toBe(400);
      const problem = JSON.parse(response.payload);
      expect(problem.status).toBe(400);
      expect(problem.detail).toContain('Captcha challenge verification failed');
    });

    it('strictly rejects unknown properties (.strict() compliance)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/leads',
        payload: {
          ...validLeadPayload,
          unrecognizedField: 'malicious',
        },
      });

      expect(response.statusCode).toBe(400);
      const problem = JSON.parse(response.payload);
      expect(problem.title).toBe('Bad Request');
    });

    it('detects honeypot and silently discards bot submission', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/leads',
        payload: validLeadPayload,
        headers: {
          'x-honeypot': 'spambot-value',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.leadId).toBe('lead_bot_discarded');
    });

    it('detects unrealistically fast fill-time (< 800ms) and discards', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/leads',
        payload: validLeadPayload,
        headers: {
          'x-fill-time': '250',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.leadId).toBe('lead_fast_discarded');
    });
  });

  describe('2. Seller Submissions Intake (POST /v1/public/submissions & /v1/submissions)', () => {
    const validSubmissionPayload = {
      sellerName: 'Marcus Aurelius Vance',
      sellerEmail: 'marcus.vance@example.com',
      sellerPhone: '+905321112233',
      countryCode: 'tr',
      city: 'Istanbul',
      area: 'Bebek',
      propertyType: 'villa',
      bedrooms: 5,
      bathrooms: 4.5,
      sizeSqm: 650,
      expectedPriceMinor: 850000000,
      currency: 'TRY',
      description: 'Historic Bosphorus waterfront Yalı with private dock and manicured gardens.',
      notes: 'Available for private inspection on short notice.',
      images: [],
      consentGiven: true,
    };

    it('registers submission, mints capability token, and enqueues submission.intake', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/submissions',
        payload: validSubmissionPayload,
        headers: {
          'idempotency-key': 'sub-idemp-001',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.submissionId).toBeDefined();
      expect(body.capabilityToken).toBeDefined();
      expect(body.trackingUrl).toContain('/sell/status?token=');

      // Verify capability token validity
      const verification = verifyCapabilityToken(body.capabilityToken);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.subId).toBe(body.submissionId);
      expect(verification.payload?.email).toBe('marcus.vance@example.com');

      // Verify database record has pending_review status
      const submission = await submissionsRepository.findSubmissionById(
        body.submissionId,
        body.capabilityToken
      );
      expect(submission).not.toBeNull();
      expect(submission?.status).toBe('pending_review');

      // Verify job dispatch
      const queued = queueService.getQueuedJobs('submission.intake');
      expect(queued.length).toBeGreaterThanOrEqual(1);
      expect(queued[0]?.data.submissionId).toBe(body.submissionId);
    });
  });

  describe('3. S3 / R2 Presigned Upload Pipeline (POST /v1/public/uploads/presign)', () => {
    it('generates presigned upload URL for valid photo MIME and size', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/uploads/presign',
        payload: {
          fileName: 'living_room_hero.webp',
          contentType: 'image/webp',
          fileSizeBytes: 1024 * 500, // 500 KB
          category: 'photo',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.uploadUrl).toBeDefined();
      expect(body.key).toContain('submissions/photos/');
      expect(body.key).toContain('living_room_hero.webp');
      expect(body.expiresInSeconds).toBe(3600);
    });

    it('generates presigned upload URL for valid PDF document', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/uploads/presign',
        payload: {
          fileName: 'title_deed_tapu.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 2 * 1024 * 1024, // 2 MB
          category: 'document',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.uploadUrl).toBeDefined();
      expect(body.key).toContain('submissions/documents/');
    });

    it('rejects disallowed file types (e.g. executable or text)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/uploads/presign',
        payload: {
          fileName: 'malicious.exe',
          contentType: 'application/x-msdownload',
          fileSizeBytes: 1024,
          category: 'document',
        },
      });

      expect(response.statusCode).toBe(400);
      const problem = JSON.parse(response.payload);
      expect(problem.status).toBe(400);
    });

    it('rejects images exceeding 15MB limit', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/uploads/presign',
        payload: {
          fileName: 'huge_photo.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 16 * 1024 * 1024, // 16 MB > 15 MB
          category: 'photo',
        },
      });

      expect(response.statusCode).toBe(400);
      const problem = JSON.parse(response.payload);
      expect(problem.detail).toContain('must not exceed 15 MB');
    });

    it('enforces storage guard: blocks presigned URL generation when hard limit is breached', async () => {
      // Artificially record 9.6 GB storage usage in usage_counters
      const todayStr = new Date().toISOString().slice(0, 10);
      const hardLimitBytes = Math.floor(9.6 * 1024 * 1024 * 1024);
      await usageRepository.updateStorageBytes(hardLimitBytes, todayStr);

      const response = await app.inject({
        method: 'POST',
        url: '/v1/public/uploads/presign',
        payload: {
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 1024 * 100,
          category: 'photo',
        },
      });

      expect(response.statusCode).toBe(403);
      const problem = JSON.parse(response.payload);
      expect(problem.detail).toContain('Storage hard limit exceeded');

      // Reset storage usage
      await usageRepository.updateStorageBytes(-hardLimitBytes, todayStr);
    });
  });

  describe('4. Background Worker Handlers & Quotas (apps/api/src/worker.ts)', () => {
    it('executes lead.intake job: sends P1 alert to concierge and P4 confirmation to visitor', async () => {
      // 1. Create a lead in database
      const lead = await leadsRepository.createLead({
        name: 'Sophie Laurent',
        email: 'sophie.laurent@example.com',
        phone: '+33612345678',
        countryCode: 'ae',
        type: 'inquiry',
        status: 'new',
        propertyRef: 'WH-AE-202',
        message: 'Looking for a sea-view apartment in Dubai Marina.',
        locale: 'en',
        preferredContact: 'email',
        consentGiven: true,
      });

      // 2. Execute worker handler
      const result = await workerService.handleLeadIntake({ leadId: lead.id });
      expect(result.staffEmailSent).toBe(true);
      expect(result.visitorEmailSent).toBe(true);
      expect(result.deferred).toBe(false);
    });

    it('applies email quota throttle: skips P4 visitor confirmation when daily count exceeds 70%', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      // Artificially increment email count to 65 (threshold is 63 out of 90)
      await usageRepository.incrementEmailCount(todayStr, 65);

      const lead = await leadsRepository.createLead({
        name: 'Throttled User',
        email: 'throttled@example.com',
        phone: '+995555123456',
        countryCode: 'ge',
        type: 'inquiry',
        status: 'new',
        locale: 'en',
        preferredContact: 'whatsapp',
        consentGiven: true,
      });

      const result = await workerService.handleLeadIntake({ leadId: lead.id });
      // Staff alert (P1) is always sent
      expect(result.staffEmailSent).toBe(true);
      // Client confirmation (P4) is skipped to conserve remaining budget
      expect(result.visitorEmailSent).toBe(false);
    });

    it('applies email quota throttle: defers emails when daily cap (90) is reached', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      // Artificially set usage to 95 (> 90 cap)
      await usageRepository.incrementEmailCount(todayStr, 35); // 65 + 35 = 100

      const lead = await leadsRepository.createLead({
        name: 'Capped User',
        email: 'capped@example.com',
        phone: '+201012345678',
        countryCode: 'eg',
        type: 'inquiry',
        status: 'new',
        locale: 'en',
        preferredContact: 'phone',
        consentGiven: true,
      });

      const result = await workerService.handleLeadIntake({ leadId: lead.id });
      // At cap, email is deferred rather than dropped
      expect(result.deferred).toBe(true);
      expect(result.staffEmailSent).toBe(false);
    });

    const testSubId = '018f0000-0000-7000-a000-000000000001';

    it('executes submission.intake: sends P1 alert and P3 tracking link', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      await usageRepository.resetDailyUsage(todayStr);

      const submission = await submissionsRepository.createSubmission({
        id: testSubId,
        sellerName: 'Alexander Hayes',
        sellerEmail: 'alex.hayes@example.com',
        sellerPhone: '+995555778899',
        countryCode: 'ge',
        city: 'Tbilisi',
        area: 'Vake',
        propertyType: 'villa',
        bedrooms: 4,
        bathrooms: '3.0',
        sizeSqm: '380.00',
        expectedPriceMinor: 120000000,
        currency: 'GEL',
        status: 'pending_review',
        capabilityToken: 'test.capability.token',
      });

      const result = await workerService.handleSubmissionIntake({
        submissionId: submission.id,
        capabilityToken: 'test.capability.token',
      });

      expect(result.staffEmailSent).toBe(true);
      expect(result.sellerEmailSent).toBe(true);
    });

    it('executes media.process: validates in S3, strips EXIF, converts to WebP with Sharp, and records storage bytes', async () => {
      // 1. Create a test JPEG buffer using Sharp
      const sampleJpeg = await sharp({
        create: {
          width: 200,
          height: 150,
          channels: 3,
          background: { r: 16, g: 27, b: 51 }, // Navy brand color
        },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      // 2. Put raw JPEG in mock storage
      const bucket = 'wildhills-media';
      const key = 'submissions/photos/raw_upload.jpg';
      await mockStorage.putObject({
        bucket,
        key,
        body: sampleJpeg,
        contentType: 'image/jpeg',
      });

      // 3. Run worker media processing
      const processed = await workerService.handleMediaProcess({
        bucket,
        key,
        contentType: 'image/jpeg',
        submissionId: testSubId,
      });

      expect(processed.isWebP).toBe(true);
      expect(processed.processedKey).toBe('submissions/photos/raw_upload.webp');
      expect(processed.sizeBytes).toBeLessThan(250 * 1024); // within 250 KB budget

      // 4. Verify WebP was saved in storage
      const savedObject = await mockStorage.getObject(bucket, processed.processedKey);
      expect(savedObject.contentType).toBe('image/webp');

      // 5. Verify linked submission document in DB
      const docs = await submissionsRepository.getSubmissionDocuments(testSubId);
      expect(docs.length).toBeGreaterThanOrEqual(1);
      expect(docs[0]?.contentType).toBe('image/webp');
    });

    it('executes fx.refresh: updates exchange rates table from FxProvider', async () => {
      const refreshed = await workerService.handleFxRefresh();
      expect(refreshed).toBe(true);
    });
  });
});
