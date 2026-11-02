import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import { runMigrations } from '../src/db/migrate.js';
import * as schema from '../src/db/schema/index.js';
import {
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  getTotpUri,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  getPasskeyRegistrationOptions,
  getPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  isAuthenticatorClone,
  createSession,
  validateSession,
  rotateSession,
  stepUpSession,
  revokeSession,
  revokeAllUserSessions,
  hashSessionToken,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  setSessionCookie,
  getSessionTokenFromRequest,
  clearSessionCookie,
  SECURE_COOKIE_NAME,
  INSECURE_COOKIE_NAME,
  validateCsrf,
  generateCsrfToken,
  verifyCsrfToken,
  authRateLimiter,
  mintCapabilityToken,
  verifyCapabilityToken,
  exchangeCapabilityToken,
  createStaffInvitation,
  validateStaffInvitation,
  acceptStaffInvitation,
  authorize,
  type PolicyActor,
  recordAuthEvent,
} from '../src/auth/index.js';
import { PERMISSIONS } from '@wild-hills/contracts';

describe('Stage B3: Identity, Sessions, and Authorization', () => {
  let pglite: PGlite;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pglite = new PGlite({
      extensions: { citext, pg_trgm, unaccent },
    });
    db = drizzle(pglite, { schema });
    // Run forward migrations 0001 to 0004
    await runMigrations(pglite);
  });

  afterAll(async () => {
    if (pglite) {
      await pglite.close();
    }
  });

  // =========================================================================
  // 1. Password Fallback & Argon2id Engine
  // =========================================================================
  describe('1. Password Fallback (Argon2id)', () => {
    it('hashes passwords using Argon2id and verifies correctly', async () => {
      const plaintext = 'SuperSecretP@ssword2026!';
      const hash = await hashPassword(plaintext);

      expect(hash).toContain('$argon2id$');
      expect(await verifyPassword(hash, plaintext)).toBe(true);
      expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
      expect(await verifyPassword(hash, '')).toBe(false);
    });

    it('rejects empty or invalid inputs', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. TOTP RFC 6238 & Recovery Codes Engine
  // =========================================================================
  describe('2. TOTP Engine & Emergency Recovery Codes', () => {
    it('generates Base32 secrets and standard otpauth URIs', () => {
      const secret = generateTotpSecret();
      expect(secret).toMatch(/^[A-Z2-7]{32}$/);

      const uri = getTotpUri('alex@wildhills.com', secret);
      expect(uri).toContain('otpauth://totp/Wild%20Hills:alex%40wildhills.com');
      expect(uri).toContain(`secret=${secret}`);
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    it('generates and verifies 6-digit RFC 6238 TOTP codes with clock drift window', () => {
      const secret = generateTotpSecret();
      const now = Date.now();
      const code = generateTotpCode(secret, now);

      expect(code).toMatch(/^\d{6}$/);
      // Valid at current time
      expect(verifyTotpCode(code, secret, 1, now)).toBe(true);

      // Valid within +/- 30 seconds drift window
      expect(verifyTotpCode(code, secret, 1, now + 25 * 1000)).toBe(true);
      expect(verifyTotpCode(code, secret, 1, now - 25 * 1000)).toBe(true);

      // Invalid outside +/- 1 step window (e.g. 70s drift)
      expect(verifyTotpCode(code, secret, 1, now + 70 * 1000)).toBe(false);

      // Invalid code
      expect(verifyTotpCode('000000', secret, 1, now)).toBe(false);
    });

    it('generates 10 single-use emergency recovery codes with secure SHA-256 hashes', () => {
      const { codes, pairs } = generateRecoveryCodes(10);
      expect(codes.length).toBe(10);
      expect(pairs.length).toBe(10);

      for (const pair of pairs) {
        expect(pair.code).toMatch(/^WH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(pair.hash).toHaveLength(64); // SHA-256 hex string
        expect(hashRecoveryCode(pair.code)).toBe(pair.hash);
      }
    });
  });

  // =========================================================================
  // 3. WebAuthn Passkeys & Clone Protection
  // =========================================================================
  describe('3. WebAuthn Passkeys & Clone Protection', () => {
    it('generates valid WebAuthn registration and authentication options', async () => {
      const user = { id: 'usr-passkey-01', email: 'owner@wildhills.com', name: 'Owner' };
      const regOptions = await getPasskeyRegistrationOptions(user, []);

      expect(regOptions.challenge).toBeDefined();
      expect(regOptions.rp.name).toBe('Wild Hills Real Estate');
      expect(regOptions.user.name).toBe('owner@wildhills.com');

      const authOptions = await getPasskeyAuthenticationOptions();
      expect(authOptions.challenge).toBeDefined();
      expect(authOptions.rpId).toBe('localhost');
    });

    it('detects authenticator counter rollback and cloned authenticators', async () => {
      // 1. Explicit counter clone detection logic
      expect(isAuthenticatorClone(10, 10)).toBe(true); // Equal counter: rollback / cloned
      expect(isAuthenticatorClone(10, 9)).toBe(true);  // Decreased counter: rollback
      expect(isAuthenticatorClone(10, 11)).toBe(false); // Valid incremented counter
      expect(isAuthenticatorClone(0, 0)).toBe(false);   // First use or non-counting authenticator

      const passkeyRecord = {
        id: 'pk-cred-101',
        publicKey: Buffer.from('test-public-key').toString('base64url'),
        counter: 10,
        transports: ['internal'],
      };

      // 2. Malformed / non-increasing counter response handling
      const mockResponse: any = {
        id: 'pk-cred-101',
        rawId: 'pk-cred-101',
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: 'dummy' })).toString('base64url'),
          authenticatorData: Buffer.from('dummy').toString('base64url'),
          signature: Buffer.from('sig').toString('base64url'),
        },
        type: 'public-key',
      };

      const result = await verifyPasskeyAuthentication(
        mockResponse,
        'dummy-challenge',
        passkeyRecord
      );

      expect(result.verified).toBe(false);
    });
  });

  // =========================================================================
  // 4. Session Lifecycle, Timeouts & Rotation
  // =========================================================================
  describe('4. Session Lifecycle & Token Rotation', () => {
    let testUserId: string;

    beforeAll(async () => {
      // Seed a test user
      const [u] = await db
        .insert(schema.users)
        .values({
          email: 'session-test@wildhills.com',
          name: 'Session Tester',
          role: 'agent',
          countryScopes: ['ae'],
          isActive: true,
        })
        .returning();
      testUserId = u.id;
    });

    it('creates a session with a hashed token stored in the database', async () => {
      const { rawToken, session } = await createSession(db, {
        userId: testUserId,
        ipAddress: '192.168.1.10',
        userAgent: 'Vitest/Test-Agent',
      });

      expect(rawToken).toHaveLength(64);
      expect(session.id).toBe(hashSessionToken(rawToken));
      expect(session.userId).toBe(testUserId);
      expect(session.ipAddress).toBe('192.168.1.10');
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('validates active session and updates last_active_at', async () => {
      const { rawToken } = await createSession(db, { userId: testUserId });
      const validated = await validateSession(db, rawToken);

      expect(validated).not.toBeNull();
      expect(validated?.user.id).toBe(testUserId);
      expect(validated?.session.lastActiveAt).toBeDefined();
    });

    it('enforces idle timeout (2 hours) and revokes expired session', async () => {
      const { rawToken, session } = await createSession(db, { userId: testUserId });

      // Artificially fast-forward last_active_at past 2 hours
      const pastIdle = new Date(Date.now() - (SESSION_IDLE_TIMEOUT_MS + 1000));
      await db
        .update(schema.sessions)
        .set({ lastActiveAt: pastIdle })
        .where(eq(schema.sessions.id, session.id));

      const validated = await validateSession(db, rawToken);
      expect(validated).toBeNull();

      // Ensure session row was deleted from database
      const check = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id));
      expect(check.length).toBe(0);
    });

    it('enforces absolute timeout (12 hours) and revokes expired session', async () => {
      const { rawToken, session } = await createSession(db, { userId: testUserId });

      // Artificially set expires_at in the past
      const pastExpires = new Date(Date.now() - 1000);
      await db
        .update(schema.sessions)
        .set({ expiresAt: pastExpires })
        .where(eq(schema.sessions.id, session.id));

      const validated = await validateSession(db, rawToken);
      expect(validated).toBeNull();
    });

    it('rotates session token upon login / privilege elevation', async () => {
      const { rawToken: initialToken, session: initialSession } = await createSession(db, {
        userId: testUserId,
        ipAddress: '10.0.0.1',
      });

      const rotated = await rotateSession(db, initialToken, { ipAddress: '10.0.0.2' });
      expect(rotated).not.toBeNull();
      expect(rotated?.rawToken).not.toBe(initialToken);
      expect(rotated?.session.ipAddress).toBe('10.0.0.2');

      // Old session must no longer exist
      expect(await validateSession(db, initialToken)).toBeNull();
      // New session must be valid
      expect(await validateSession(db, rotated!.rawToken)).not.toBeNull();
    });

    it('elevates session via stepUpSession for 15 minutes', async () => {
      const { rawToken } = await createSession(db, { userId: testUserId });
      const steppedUp = await stepUpSession(db, rawToken);

      expect(steppedUp).not.toBeNull();
      expect(steppedUp?.session.stepUpUntil).toBeDefined();
      expect(steppedUp!.session.stepUpUntil!.getTime()).toBeGreaterThan(Date.now());

      const validated = await validateSession(db, steppedUp!.rawToken);
      expect(validated?.isStepUpActive).toBe(true);
    });

    it('revokes remote session and revokes all sessions for user', async () => {
      const { rawToken: t1 } = await createSession(db, { userId: testUserId });
      const { rawToken: t2 } = await createSession(db, { userId: testUserId });

      // Revoke single session
      await revokeSession(db, t1);
      expect(await validateSession(db, t1)).toBeNull();
      expect(await validateSession(db, t2)).not.toBeNull();

      // Revoke all remaining sessions
      await revokeAllUserSessions(db, testUserId);
      expect(await validateSession(db, t2)).toBeNull();
    });
  });

  // =========================================================================
  // 5. Cookie Hardening & CSRF Defenses
  // =========================================================================
  describe('5. Cookie Hardening & CSRF Defenses', () => {
    it('sets hardened __Host- cookies in secure mode and wh_session in non-secure mode', () => {
      let setCookieName = '';
      let setCookieOptions: any = {};

      const mockReply: any = {
        setCookie: (name: string, val: string, opts: any) => {
          setCookieName = name;
          setCookieOptions = opts;
        },
      };

      // Secure HTTPS request
      const secureReq: any = {
        protocol: 'https',
        headers: { 'x-forwarded-proto': 'https' },
      };

      setSessionCookie(mockReply, 'dummy-token', secureReq);
      expect(setCookieName).toBe(SECURE_COOKIE_NAME);
      expect(setCookieOptions.httpOnly).toBe(true);
      expect(setCookieOptions.secure).toBe(true);
      expect(setCookieOptions.sameSite).toBe('lax');
      expect(setCookieOptions.path).toBe('/');

      // Insecure HTTP request (development)
      const insecureReq: any = {
        protocol: 'http',
        headers: {},
      };
      // Overriding process.env for test
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      setSessionCookie(mockReply, 'dummy-token', insecureReq);
      expect(setCookieOptions.httpOnly).toBe(true);
      expect(setCookieOptions.path).toBe('/');
      process.env.NODE_ENV = prevEnv;
    });

    it('extracts session token from cookies or Authorization Bearer header', () => {
      const reqWithCookie: any = {
        cookies: { [SECURE_COOKIE_NAME]: 'token-from-cookie' },
        headers: {},
      };
      expect(getSessionTokenFromRequest(reqWithCookie)).toBe('token-from-cookie');

      const reqWithHeader: any = {
        cookies: {},
        headers: { authorization: 'Bearer token-from-bearer' },
      };
      expect(getSessionTokenFromRequest(reqWithHeader)).toBe('token-from-bearer');
    });

    it('blocks CSRF cross-site requests via Sec-Fetch-Site and unauthorized Origins', () => {
      // 1. Sec-Fetch-Site: cross-site -> blocked
      const crossSiteReq: any = {
        method: 'POST',
        headers: { 'sec-fetch-site': 'cross-site' },
      };
      expect(validateCsrf(crossSiteReq).valid).toBe(false);

      // 2. Untrusted evil origin -> blocked
      const untrustedOriginReq: any = {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'same-origin',
          origin: 'https://evil-attacker.com',
        },
      };
      expect(validateCsrf(untrustedOriginReq).valid).toBe(false);

      // 3. Trusted origin -> allowed
      const trustedOriginReq: any = {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'same-origin',
          origin: 'http://localhost:3000',
        },
      };
      expect(validateCsrf(trustedOriginReq).valid).toBe(true);

      // 4. Safe GET request -> always allowed
      const safeGetReq: any = {
        method: 'GET',
        headers: { 'sec-fetch-site': 'cross-site' },
      };
      expect(validateCsrf(safeGetReq).valid).toBe(true);
    });

    it('generates and verifies session-bound CSRF tokens', () => {
      const sessionToken = 'raw-session-token-xyz';
      const csrfToken = generateCsrfToken(sessionToken);

      expect(verifyCsrfToken(sessionToken, csrfToken)).toBe(true);
      expect(verifyCsrfToken(sessionToken, 'forged-csrf-token')).toBe(false);
      expect(verifyCsrfToken('different-session', csrfToken)).toBe(false);
    });
  });

  // =========================================================================
  // 6. Brute Force Protection & Progressive Delays
  // =========================================================================
  describe('6. Progressive Rate Limiting & Brute Force Protection', () => {
    it('applies progressive delays and triggers 15-minute lockout after 6 failures', async () => {
      authRateLimiter.reset();
      const testIp = '198.51.100.42';

      // Attempts 1-3: No delay
      for (let i = 1; i <= 3; i++) {
        const res = await authRateLimiter.recordFailure(testIp);
        expect(res.isLocked).toBe(false);
        expect(res.delayMs).toBe(0);
      }

      // Attempt 4: 500ms progressive delay
      const att4 = await authRateLimiter.recordFailure(testIp);
      expect(att4.delayMs).toBe(500);
      expect(att4.isLocked).toBe(false);

      // Attempt 5: 1000ms progressive delay
      const att5 = await authRateLimiter.recordFailure(testIp);
      expect(att5.delayMs).toBe(1000);
      expect(att5.isLocked).toBe(false);

      // Attempt 6: Lockout triggered
      const att6 = await authRateLimiter.recordFailure(testIp);
      expect(att6.isLocked).toBe(true);

      // Check lockout status
      const check = authRateLimiter.check(testIp);
      expect(check.isLocked).toBe(true);
      expect(check.remainingLockoutSeconds).toBeGreaterThan(800);

      // Success resets counter
      authRateLimiter.recordSuccess(testIp);
      expect(authRateLimiter.check(testIp).isLocked).toBe(false);
    });
  });

  // =========================================================================
  // 7. Capability Tokens for "Sell With Us"
  // =========================================================================
  describe('7. Capability Tokens for Property Submitters', () => {
    it('mints cryptographically signed HMAC-SHA256 capability tokens', () => {
      const subId = 'sub-101';
      const email = 'seller@example.com';
      const token = mintCapabilityToken(subId, email);

      expect(token).toContain('.');
      const verified = verifyCapabilityToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.payload?.subId).toBe(subId);
      expect(verified.payload?.email).toBe(email);
    });

    it('rejects tampered or forged capability tokens', () => {
      const token = mintCapabilityToken('sub-101', 'seller@example.com');
      const parts = token.split('.');
      const tampered = `${parts[0]}X.${parts[1]}`;

      const verified = verifyCapabilityToken(tampered);
      expect(verified.valid).toBe(false);
    });

    it('exchanges capability token and rotates to enforce single-use', async () => {
      // Seed a test submission with capability token
      const subId = '018f0000-0000-7000-8000-000000000001';
      const initialToken = mintCapabilityToken(subId, 'seller@example.com');

      await db.insert(schema.submissions).values({
        id: subId,
        sellerName: 'Karim Seller',
        sellerEmail: 'seller@example.com',
        sellerPhone: '+971501234567',
        countryCode: 'ae',
        city: 'Dubai',
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: '2.0',
        sizeSqm: '120.00',
        expectedPriceMinor: 250000000,
        currency: 'AED',
        status: 'pending',
        capabilityToken: initialToken,
      });

      // First exchange: succeeds and rotates token
      const exchange1 = await exchangeCapabilityToken(db, initialToken);
      expect(exchange1.success).toBe(true);
      expect(exchange1.newCapabilityToken).toBeDefined();
      expect(exchange1.newCapabilityToken).not.toBe(initialToken);

      // Replay attempt with consumed initial token: must be rejected
      const replayAttempt = await exchangeCapabilityToken(db, initialToken);
      expect(replayAttempt.success).toBe(false);
      expect(replayAttempt.error).toContain('already been used');

      // New token succeeds
      const exchange2 = await exchangeCapabilityToken(db, exchange1.newCapabilityToken!);
      expect(exchange2.success).toBe(true);
    });
  });

  // =========================================================================
  // 8. Staff Onboarding & Invitations Flow
  // =========================================================================
  describe('8. Staff Invitations & Verification Flow', () => {
    it('creates a secure invitation, validates expiry, and accepts onboarding', async () => {
      const email = 'new-agent@wildhills.com';
      const { rawToken, invitation } = await createStaffInvitation(db, {
        email,
        role: 'agent',
        countryScopes: ['tr', 'ge'],
      });

      expect(invitation.email).toBe(email);
      expect(invitation.role).toBe('agent');
      expect(invitation.acceptedAt).toBeNull();

      // Validate invitation
      const validated = await validateStaffInvitation(db, rawToken);
      expect(validated).not.toBeNull();
      expect(validated?.email).toBe(email);

      // Accept invitation
      const accepted = await acceptStaffInvitation(db, {
        rawToken,
        name: 'New Agent Kerem',
        password: 'KeremSecurePassword123!',
      });

      expect(accepted.success).toBe(true);
      expect(accepted.user?.name).toBe('New Agent Kerem');
      expect(accepted.user?.role).toBe('agent');
      expect(accepted.user?.countryScopes).toEqual(['tr', 'ge']);

      // Invitation cannot be re-used
      const reValidate = await validateStaffInvitation(db, rawToken);
      expect(reValidate).toBeNull();
    });
  });

  // =========================================================================
  // 9. Table-Driven Section 10.8 Authorization Matrix
  // =========================================================================
  describe('9. Table-Driven Authorization Policy Matrix (Section 10.8)', () => {
    interface MatrixTestCase {
      actor: PolicyActor;
      permission: string;
      resource?: any;
      expectedAllowed: boolean;
      description: string;
    }

    const testCases: MatrixTestCase[] = [
      // Platform Owner: Omnipotent
      {
        actor: { role: 'wh_owner' },
        permission: PERMISSIONS.ADMIN_MANAGE_SETTINGS,
        expectedAllowed: true,
        description: 'Owner can manage site settings',
      },
      {
        actor: { role: 'wh_owner' },
        permission: PERMISSIONS.ADMIN_VIEW_AUDIT,
        expectedAllowed: true,
        description: 'Owner can view system audit logs',
      },
      {
        actor: { role: 'wh_owner' },
        permission: PERMISSIONS.ADMIN_WRITE_USERS,
        expectedAllowed: true,
        description: 'Owner can write users unconditionally',
      },

      // Admin / Country Manager: Scoped
      {
        actor: { role: 'wh_admin', countryScopes: ['ae', 'tr'] },
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
        resource: { countryCode: 'ae' },
        expectedAllowed: true,
        description: 'Admin can read listings within country scope (ae)',
      },
      {
        actor: { role: 'wh_admin', countryScopes: ['ae', 'tr'] },
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
        resource: { countryCode: 'ge' },
        expectedAllowed: false,
        description: 'Admin CANNOT read listings outside country scope (ge)',
      },
      {
        actor: { role: 'wh_admin' },
        permission: PERMISSIONS.ADMIN_MANAGE_SETTINGS,
        expectedAllowed: false,
        description: 'Admin CANNOT manage platform settings (owner only)',
      },
      {
        actor: { role: 'wh_admin' },
        permission: PERMISSIONS.ADMIN_VIEW_AUDIT,
        expectedAllowed: false,
        description: 'Admin CANNOT view audit log (owner only)',
      },
      {
        actor: { role: 'wh_admin' },
        permission: PERMISSIONS.ADMIN_WRITE_USERS,
        resource: { targetRole: 'owner' },
        expectedAllowed: false,
        description: 'Admin CANNOT alter or invite platform owner',
      },
      {
        actor: { role: 'wh_admin' },
        permission: PERMISSIONS.ADMIN_WRITE_USERS,
        resource: { targetRole: 'agent' },
        expectedAllowed: true,
        description: 'Admin CAN invite operational agent',
      },

      // Agent: Operational Scoped
      {
        actor: { role: 'wh_agent', userId: 'agent-101', countryScopes: ['ae'] },
        permission: PERMISSIONS.ADMIN_READ_LEADS,
        resource: { countryCode: 'ae', assignedAgentId: 'agent-101' },
        expectedAllowed: true,
        description: 'Agent can access leads assigned to them',
      },
      {
        actor: { role: 'wh_agent', userId: 'agent-101', countryScopes: ['ae'] },
        permission: PERMISSIONS.ADMIN_READ_LEADS,
        resource: { countryCode: 'ae', assignedAgentId: 'agent-202' },
        expectedAllowed: false,
        description: 'Agent CANNOT access leads assigned to other agents',
      },
      {
        actor: { role: 'wh_agent', userId: 'agent-101', countryScopes: ['ae'] },
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
        resource: { countryCode: 'ae', authorId: 'agent-101' },
        expectedAllowed: true,
        description: 'Agent can edit listings they authored in their country',
      },
      {
        actor: { role: 'wh_agent', userId: 'agent-101', countryScopes: ['ae'] },
        permission: PERMISSIONS.ADMIN_WRITE_LISTINGS,
        resource: { countryCode: 'ae', authorId: 'agent-202' },
        expectedAllowed: false,
        description: 'Agent CANNOT edit listings authored by others',
      },
      {
        actor: { role: 'wh_agent' },
        permission: PERMISSIONS.ADMIN_READ_USERS,
        expectedAllowed: false,
        description: 'Agent CANNOT read users list',
      },
      {
        actor: { role: 'wh_agent' },
        permission: PERMISSIONS.ADMIN_MANAGE_LOCATIONS,
        expectedAllowed: false,
        description: 'Agent CANNOT manage locations',
      },

      // Public Visitors
      {
        actor: { role: 'public' },
        permission: PERMISSIONS.READ_PUBLIC,
        expectedAllowed: true,
        description: 'Public can read public content',
      },
      {
        actor: { role: 'public' },
        permission: PERMISSIONS.CREATE_LEAD,
        expectedAllowed: true,
        description: 'Public can submit property inquiries / leads',
      },
      {
        actor: { role: 'public' },
        permission: PERMISSIONS.CREATE_SUBMISSION,
        expectedAllowed: true,
        description: 'Public can submit "Sell With Us" properties',
      },
      {
        actor: { role: 'public' },
        permission: PERMISSIONS.ADMIN_READ_LISTINGS,
        expectedAllowed: false,
        description: 'Public CANNOT access admin listings',
      },

      // Submitter with capability token
      {
        actor: { role: 'submitter', submissionToken: 'sub-tok-123' },
        permission: PERMISSIONS.CREATE_SUBMISSION,
        resource: { submissionToken: 'sub-tok-123' },
        expectedAllowed: true,
        description: 'Submitter can access matching submission',
      },
      {
        actor: { role: 'submitter', submissionToken: 'sub-tok-123' },
        permission: PERMISSIONS.ADMIN_READ_LEADS,
        resource: { submissionToken: 'sub-tok-123' },
        expectedAllowed: false,
        description: 'Submitter CANNOT access CRM leads',
      },
    ];

    for (const tc of testCases) {
      it(`Matrix Check: ${tc.description}`, () => {
        const res = authorize(tc.actor, tc.permission, tc.resource);
        expect(res.allowed).toBe(tc.expectedAllowed);
      });
    }
  });

  // =========================================================================
  // 10. Audit Logging for Auth Events
  // =========================================================================
  describe('10. Immutable Audit Logging for Auth Events', () => {
    it('records immutable audit events with secret redaction in audit_log', async () => {
      await recordAuthEvent(db, {
        action: 'auth.login.success',
        actorId: '018f0000-0000-7000-8000-000000000099',
        actorEmail: 'audit-test@wildhills.com',
        actorRole: 'admin',
        ipAddress: '203.0.113.195',
        changes: {
          method: 'passkey',
          password: 'MUST_BE_REDACTED',
          secret: 'MUST_BE_REDACTED',
          userAgent: 'TestBrowser',
        },
      });

      const rows = await db
        .select()
        .from(schema.auditLog)
        .where(eq(schema.auditLog.actorEmail, 'audit-test@wildhills.com'));

      expect(rows.length).toBeGreaterThan(0);
      const entry = rows[0];
      expect(entry.action).toBe('auth.login.success');
      expect(entry.actorRole).toBe('admin');
      expect(entry.ipAddress).toBe('203.0.113.195');

      // Verify passwords and secrets were strictly redacted
      const changes: any = entry.changes;
      expect(changes.password).toBeUndefined();
      expect(changes.secret).toBeUndefined();
      expect(changes.method).toBe('passkey');
    });
  });
});
