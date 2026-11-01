import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { buildApp } from '../src/app.js';
import { REDACTED_PATHS } from '../src/plugins/logging.js';
import {
  MailpitEmailAdapter,
  MinioStorageAdapter,
  FixtureFxAdapter,
  TurnstileDummyVerifier,
} from '../src/providers/index.js';

describe('Stage B1: Backend Foundation & API Baseline', () => {
  it('1. /v1/internal/readyz returns 200 OK with readiness status', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/v1/internal/readyz',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.database).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  it('2. /v1/internal/healthz returns 200 OK with liveness status', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/v1/internal/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.uptime).toBeTypeOf('number');
  });

  it('3. Unknown routes return RFC 9457 application/problem+json', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/unknown-endpoint-route-check',
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');

    const problem = JSON.parse(response.payload);
    expect(problem.type).toBe('https://datatracker.ietf.org/doc/html/rfc9457#section-3.1');
    expect(problem.title).toBe('Not Found');
    expect(problem.status).toBe(404);
    expect(problem.detail).toContain('Route GET /unknown-endpoint-route-check not found');
    expect(problem.instance).toBe('/unknown-endpoint-route-check');
  });

  it('4. Pino redaction censors Authorization and sensitive headers to [REDACTED]', async () => {
    const logEntries: any[] = [];
    const customStream = {
      write(msg: string) {
        try {
          logEntries.push(JSON.parse(msg));
        } catch {
          logEntries.push(msg);
        }
      },
    };

    const loggerInstance = pino(
      {
        level: 'info',
        redact: {
          paths: REDACTED_PATHS,
          censor: '[REDACTED]',
        },
        serializers: {
          req(req: any) {
            return {
              headers: req.headers,
              method: req.method,
              url: req.url,
            };
          },
        },
      },
      customStream
    );

    const app = await buildApp(loggerInstance);

    const secretToken = 'super-secret-bearer-token-xyz';
    const response = await app.inject({
      method: 'GET',
      url: '/v1/internal/healthz',
      headers: {
        authorization: `Bearer ${secretToken}`,
        cookie: 'sessionId=secret-session-id',
      },
    });

    expect(response.statusCode).toBe(200);

    // Verify raw secret does not exist in any serialized log message
    const allLogsText = JSON.stringify(logEntries);
    expect(allLogsText).not.toContain(secretToken);
    expect(allLogsText).not.toContain('secret-session-id');

    // Find the request log entry and assert redacted value
    const reqLog = logEntries.find((entry) => entry.req && entry.req.headers);
    expect(reqLog).toBeDefined();
    expect(reqLog.req.headers.authorization).toBe('[REDACTED]');
    expect(reqLog.req.headers.cookie).toBe('[REDACTED]');
  });

  describe('Service Provider Adapters', () => {
    it('MailpitEmailAdapter delivers email and tracks usage counters', async () => {
      const adapter = new MailpitEmailAdapter();
      const result = await adapter.sendEmail({
        to: 'client@example.com',
        subject: 'Welcome to Wild Hills',
        html: '<p>Welcome</p>',
        priority: 'P1',
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^mail_/);

      const quota = await adapter.checkQuota();
      expect(quota.dailyUsed).toBe(1);
      expect(quota.dailyCap).toBe(90);
      expect(quota.monthlyUsed).toBe(1);
      expect(quota.monthlyCap).toBe(2700);
    });

    it('MinioStorageAdapter handles object lifecycle', async () => {
      const storage = new MinioStorageAdapter();
      const testBuffer = Buffer.from('Luxury villa blueprint');

      const putRes = await storage.putObject({
        bucket: 'wild-hills-public',
        key: 'floorplans/villa-101.txt',
        body: testBuffer,
        contentType: 'text/plain',
      });

      expect(putRes.key).toBe('floorplans/villa-101.txt');
      expect(putRes.etag).toBeDefined();

      const getRes = await storage.getObject('wild-hills-public', 'floorplans/villa-101.txt');
      expect(getRes.body.toString()).toBe('Luxury villa blueprint');

      const presigned = await storage.getPresignedUploadUrl('wild-hills-public', 'uploads/new.webp');
      expect(presigned.uploadUrl).toContain('mock-presigned=true');

      const usage = await storage.getUsageBytes('wild-hills-public');
      expect(usage).toBe(testBuffer.length);

      await storage.deleteObject('wild-hills-public', 'floorplans/villa-101.txt');
      await expect(storage.getObject('wild-hills-public', 'floorplans/villa-101.txt')).rejects.toThrow();
    });

    it('FixtureFxAdapter provides exchange rates across supported currencies', async () => {
      const fx = new FixtureFxAdapter();
      const rates = await fx.getRates('USD');

      expect(rates.base).toBe('USD');
      expect(rates.rates.AED).toBe(3.6725);
      expect(rates.rates.EUR).toBe(0.9245);
      expect(rates.rates.TRY).toBe(34.25);
      expect(rates.rates.GEL).toBe(2.72);
      expect(rates.rates.EGP).toBe(48.65);
    });

    it('TurnstileDummyVerifier validates official test tokens', async () => {
      const verifier = new TurnstileDummyVerifier();

      const passResult = await verifier.verifyToken('1x00000000000000000000AA');
      expect(passResult.success).toBe(true);

      const failResult = await verifier.verifyToken('2x00000000000000000000AB');
      expect(failResult.success).toBe(false);

      const emptyResult = await verifier.verifyToken('');
      expect(emptyResult.success).toBe(false);
    });
  });
});
