import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { runMigrations } from '../src/db/migrate.js';
import * as schema from '../src/db/schema/index.js';
import { setDatabase } from '../src/db/index.js';
import { buildApp } from '../src/app.js';
import { hashPassword } from '../src/auth/passwords.js';
import { generateTotpSecret, generateTotpCode } from '../src/auth/totp.js';
import { mintCapabilityToken } from '../src/auth/capability.js';
import { SECURE_COOKIE_NAME, INSECURE_COOKIE_NAME } from '../src/auth/cookies.js';

describe('Stage B3: Auth HTTP Endpoints Integration', () => {
  let app: FastifyInstance;
  let pglite: PGlite;
  let testOwnerId: string;
  let testPassword = 'OwnerSecurePassword2026!';
  let totpSecret: string;

  beforeAll(async () => {
    // 1. Initialize PGlite database
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    const db = drizzle(pglite, { schema });
    setDatabase(db);
    await runMigrations(pglite);

    // 2. Seed owner user
    const passwordHash = await hashPassword(testPassword);
    const [owner] = await db
      .insert(schema.users)
      .values({
        email: 'owner@wildhills.com',
        name: 'Elena Rostova',
        role: 'owner',
        isActive: true,
        countryScopes: ['ae', 'tr', 'ge', 'eg'],
        passwordHash,
      })
      .returning();
    testOwnerId = owner.id;

    // Seed verified TOTP factor for owner
    totpSecret = generateTotpSecret();
    await db.insert(schema.totpFactors).values({
      userId: testOwnerId,
      secret: totpSecret,
      isVerified: true,
    });

    // 3. Build Fastify application
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (pglite) {
      await pglite.close();
    }
  });

  it('1. POST /v1/auth/login requires TOTP when MFA is enabled', async () => {
    // Attempt login without TOTP code
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload);
    expect(body.title).toBe('MFA Required');
    expect(body.mfaRequired).toBe(true);
  });

  it('2. POST /v1/auth/login succeeds with valid password and TOTP, setting cookie', async () => {
    const validTotp = generateTotpCode(totpSecret);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
        totpCode: validTotp,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('owner@wildhills.com');
    expect(body.user.role).toBe('owner');
    expect(body.token).toBeDefined();
    expect(body.csrfToken).toBeDefined();

    // Check Set-Cookie header exists
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(String(setCookie)).toContain('wh_session=');
    expect(String(setCookie)).toContain('HttpOnly');
    expect(String(setCookie)).toContain('SameSite=Lax');
  });

  it('3. GET /v1/auth/me returns current authenticated user and session', async () => {
    const validTotp = generateTotpCode(totpSecret);
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
        totpCode: validTotp,
      },
    });
    const { token } = JSON.parse(loginRes.payload);

    // Call /me with Bearer token
    const meRes = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const meBody = JSON.parse(meRes.payload);
    expect(meBody.user.email).toBe('owner@wildhills.com');
    expect(meBody.user.role).toBe('owner');
    expect(meBody.session.id).toBeDefined();
    expect(meBody.isStepUp).toBe(false);
  });

  it('4. POST /v1/auth/step-up elevates session and rotates token', async () => {
    const validTotp = generateTotpCode(totpSecret);
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
        totpCode: validTotp,
      },
    });
    const { token: initialToken } = JSON.parse(loginRes.payload);

    // Elevate session via step-up
    const stepUpTotp = generateTotpCode(totpSecret);
    const stepUpRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/step-up',
      headers: {
        authorization: `Bearer ${initialToken}`,
        'content-type': 'application/json',
      },
      payload: {
        totpCode: stepUpTotp,
      },
    });

    expect(stepUpRes.statusCode).toBe(200);
    const stepUpBody = JSON.parse(stepUpRes.payload);
    expect(stepUpBody.isStepUpActive).toBe(true);
    expect(stepUpBody.token).not.toBe(initialToken); // Token rotated!

    // Verify /me with new elevated token shows isStepUp = true
    const meRes = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: {
        authorization: `Bearer ${stepUpBody.token}`,
      },
    });
    const meBody = JSON.parse(meRes.payload);
    expect(meBody.isStepUp).toBe(true);
  });

  it('5. POST /v1/auth/invitations creates staff invitation with admin:write:users', async () => {
    const validTotp = generateTotpCode(totpSecret);
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
        totpCode: validTotp,
      },
    });
    const { token } = JSON.parse(loginRes.payload);

    const inviteRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/invitations',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: {
        email: 'agent-onboarding@wildhills.com',
        role: 'agent',
        countryScopes: ['ae'],
      },
    });

    expect(inviteRes.statusCode).toBe(201);
    const inviteBody = JSON.parse(inviteRes.payload);
    expect(inviteBody.success).toBe(true);
    expect(inviteBody.token).toBeDefined();

    // Accept invitation via public route
    const acceptRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/invitations/accept',
      headers: { 'content-type': 'application/json' },
      payload: {
        token: inviteBody.token,
        name: 'Agent Layla',
        password: 'LaylaSecurePassword123!',
      },
    });

    expect(acceptRes.statusCode).toBe(200);
    const acceptBody = JSON.parse(acceptRes.payload);
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.user.name).toBe('Agent Layla');
    expect(acceptBody.user.role).toBe('agent');
  });

  it('6. POST /v1/auth/logout revokes session and clears cookie', async () => {
    const validTotp = generateTotpCode(totpSecret);
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: 'owner@wildhills.com',
        password: testPassword,
        totpCode: validTotp,
      },
    });
    const { token } = JSON.parse(loginRes.payload);

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(logoutRes.statusCode).toBe(200);

    // Old token should now be rejected on /me
    const meRes = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.statusCode).toBe(401);
  });
});
