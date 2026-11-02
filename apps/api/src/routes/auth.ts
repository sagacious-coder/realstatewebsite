import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, passkeys, totpFactors, recoveryCodes, webauthnChallenges } from '../db/schema/users.js';
import {
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  getTotpUri,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  createSession,
  rotateSession,
  stepUpSession,
  revokeSession,
  setSessionCookie,
  clearSessionCookie,
  authRateLimiter,
  recordAuthEvent,
  createStaffInvitation,
  acceptStaffInvitation,
  validateStaffInvitation,
  exchangeCapabilityToken,
  generateCsrfToken,
} from '../auth/index.js';
import { PERMISSIONS } from '@wild-hills/contracts';

// Request body validation schemas
const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
}).strict();

const PasskeyLoginOptionsSchema = z.object({
  email: z.string().email().optional(),
}).strict();

const PasskeyLoginVerifySchema = z.object({
  response: z.any(),
  challengeId: z.string(),
}).strict();

const PasskeyRegisterVerifySchema = z.object({
  response: z.any(),
  challengeId: z.string(),
}).strict();

const TotpVerifySchema = z.object({
  code: z.string().min(6).max(6),
}).strict();

const RecoveryVerifySchema = z.object({
  email: z.string().email(),
  recoveryCode: z.string().min(10),
}).strict();

const StepUpSchema = z.object({
  totpCode: z.string().optional(),
}).strict();

const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'agent', 'editor']),
  countryScopes: z.array(z.string()).default([]),
}).strict();

const AcceptInvitationSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
}).strict();

const CapabilityExchangeSchema = z.object({
  token: z.string().min(10),
}).strict();

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Password Fallback Login
  fastify.post(
    '/v1/auth/login',
    {
      config: { audience: 'public', rateLimitClass: 'auth' },
      schema: { body: LoginBodySchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof LoginBodySchema> }>, reply: FastifyReply) => {
      const { email, password, totpCode } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // Check user exists
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      const user = userList[0];
      if (!user || !user.isActive) {
        await authRateLimiter.recordFailure(req.ip);
        await recordAuthEvent(db, {
          action: 'auth.login.failure',
          actorEmail: normalizedEmail,
          ipAddress: req.ip,
          changes: { reason: 'User not found or inactive' },
        });
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password',
        });
      }

      // Verify password
      if (!user.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
        await authRateLimiter.recordFailure(req.ip);
        await recordAuthEvent(db, {
          action: 'auth.login.failure',
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          ipAddress: req.ip,
          changes: { reason: 'Invalid password' },
        });
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password',
        });
      }

      // Check MFA requirement if user has verified TOTP factors
      const factors = await db
        .select()
        .from(totpFactors)
        .where(and(eq(totpFactors.userId, user.id), eq(totpFactors.isVerified, true)))
        .limit(1);

      const factor = factors[0];
      if (factor) {
        if (!totpCode) {
          return reply.status(403).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'MFA Required',
            status: 403,
            detail: 'Two-factor TOTP authentication code is required',
            mfaRequired: true,
          });
        }

        const validTotp = verifyTotpCode(totpCode, factor.secret);
        if (!validTotp) {
          await authRateLimiter.recordFailure(req.ip);
          await recordAuthEvent(db, {
            action: 'auth.login.failure',
            actorId: user.id,
            actorEmail: user.email,
            ipAddress: req.ip,
            changes: { reason: 'Invalid TOTP code' },
          });
          return reply.status(401).send({
            type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
            title: 'Unauthorized',
            status: 401,
            detail: 'Invalid two-factor authentication code',
          });
        }
      }

      // Login success: reset rate limiter failures
      authRateLimiter.recordSuccess(req.ip);

      // Create session
      const { rawToken, session } = await createSession(db, {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      // Set hardened cookie
      setSessionCookie(reply, rawToken, req);

      await recordAuthEvent(db, {
        action: 'auth.login.success',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        ipAddress: req.ip,
        changes: { method: 'password' },
      });

      const csrfToken = generateCsrfToken(rawToken);

      return reply.status(200).send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          countryScopes: user.countryScopes,
        },
        token: rawToken,
        csrfToken,
      });
    }
  );

  // 2. Passkey Authentication: Options
  fastify.post(
    '/v1/auth/passkey/login/options',
    {
      config: { audience: 'public', rateLimitClass: 'auth' },
      schema: { body: PasskeyLoginOptionsSchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof PasskeyLoginOptionsSchema> }>, reply: FastifyReply) => {
      let allowedPasskeys: any[] | undefined = undefined;

      if (req.body.email) {
        const userRows = await db
          .select()
          .from(users)
          .where(eq(users.email, req.body.email.trim().toLowerCase()))
          .limit(1);

        const targetUser = userRows[0];
        if (targetUser) {
          allowedPasskeys = await db
            .select()
            .from(passkeys)
            .where(eq(passkeys.userId, targetUser.id));
        }
      }

      const options = await getPasskeyAuthenticationOptions(allowedPasskeys);

      // Persist challenge
      await db.insert(webauthnChallenges).values({
        id: options.challenge,
        challenge: options.challenge,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      return reply.status(200).send(options);
    }
  );

  // 3. Passkey Authentication: Verify Assertion
  fastify.post(
    '/v1/auth/passkey/login/verify',
    {
      config: { audience: 'public', rateLimitClass: 'auth' },
      schema: { body: PasskeyLoginVerifySchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof PasskeyLoginVerifySchema> }>, reply: FastifyReply) => {
      const { response, challengeId } = req.body;

      // Find challenge
      const challengeList = await db
        .select()
        .from(webauthnChallenges)
        .where(eq(webauthnChallenges.id, challengeId))
        .limit(1);

      const challenge = challengeList[0];
      if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Bad Request',
          status: 400,
          detail: 'WebAuthn challenge has expired or is invalid',
        });
      }

      // Find passkey by credential id
      const passkeyList = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.id, response.id))
        .limit(1);

      const storedPasskey = passkeyList[0];
      if (!storedPasskey) {
        return reply.status(404).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: 'Passkey credential not registered',
        });
      }

      // Verify passkey assertion
      const verification = await verifyPasskeyAuthentication(
        response,
        challenge.challenge,
        storedPasskey
      );

      // Delete consumed challenge
      await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, challengeId));

      if (!verification.verified) {
        await authRateLimiter.recordFailure(req.ip);
        await recordAuthEvent(db, {
          action: 'auth.login.failure',
          actorId: storedPasskey.userId,
          ipAddress: req.ip,
          changes: { reason: verification.error },
        });
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: verification.error || 'Passkey verification failed',
        });
      }

      // Update counter
      await db
        .update(passkeys)
        .set({ counter: verification.newCounter })
        .where(eq(passkeys.id, storedPasskey.id));

      // Fetch user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, storedPasskey.userId))
        .limit(1);

      if (!user || !user.isActive) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'User account disabled',
        });
      }

      authRateLimiter.recordSuccess(req.ip);

      // Create session
      const { rawToken } = await createSession(db, {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      setSessionCookie(reply, rawToken, req);

      await recordAuthEvent(db, {
        action: 'auth.passkey.authenticated',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        ipAddress: req.ip,
      });

      const csrfToken = generateCsrfToken(rawToken);

      return reply.status(200).send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          countryScopes: user.countryScopes,
        },
        token: rawToken,
        csrfToken,
      });
    }
  );

  // 4. Passkey Registration: Options (Authenticated)
  fastify.post(
    '/v1/auth/passkey/register/options',
    {
      config: { audience: 'admin' },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const existingPasskeys = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.userId, req.user.id));

      const options = await getPasskeyRegistrationOptions(req.user, existingPasskeys);

      await db.insert(webauthnChallenges).values({
        id: options.challenge,
        userId: req.user.id,
        challenge: options.challenge,
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      return reply.status(200).send(options);
    }
  );

  // 5. Passkey Registration: Verify (Authenticated)
  fastify.post(
    '/v1/auth/passkey/register/verify',
    {
      config: { audience: 'admin' },
      schema: { body: PasskeyRegisterVerifySchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof PasskeyRegisterVerifySchema> }>, reply: FastifyReply) => {
      if (!req.user) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const { response, challengeId } = req.body;

      const challengeList = await db
        .select()
        .from(webauthnChallenges)
        .where(eq(webauthnChallenges.id, challengeId))
        .limit(1);

      const regChallenge = challengeList[0];
      if (!regChallenge || regChallenge.expiresAt.getTime() <= Date.now()) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Bad Request',
          status: 400,
          detail: 'Registration challenge has expired or is invalid',
        });
      }

      const verification = await verifyPasskeyRegistration(response, regChallenge.challenge);
      await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, challengeId));

      if (!verification.verified || !verification.registrationInfo) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Registration Failed',
          status: 400,
          detail: verification.error || 'Failed to verify passkey registration',
        });
      }

      const info = verification.registrationInfo;

      await db.insert(passkeys).values({
        id: info.credentialID,
        userId: req.user.id,
        publicKey: info.credentialPublicKey,
        counter: info.counter,
        deviceType: info.credentialDeviceType || null,
        backedUp: info.credentialBackedUp || false,
        transports: (info.transports as string[]) || [],
        createdAt: new Date(),
      });

      await recordAuthEvent(db, {
        action: 'auth.passkey.registered',
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        resourceId: info.credentialID,
        ipAddress: req.ip,
      });

      return reply.status(200).send({ success: true, credentialId: info.credentialID });
    }
  );

  // 6. TOTP Setup: Generate Secret & QR URI
  fastify.post(
    '/v1/auth/totp/setup',
    {
      config: { audience: 'admin' },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const secret = generateTotpSecret();
      const uri = getTotpUri(req.user.email, secret);

      // Remove any unverified factors and insert new factor
      await db.delete(totpFactors).where(and(eq(totpFactors.userId, req.user.id), eq(totpFactors.isVerified, false)));

      await db.insert(totpFactors).values({
        userId: req.user.id,
        secret,
        isVerified: false,
        createdAt: new Date(),
      });

      return reply.status(200).send({ secret, uri });
    }
  );

  // 7. TOTP Verify & Activate (issues emergency recovery codes)
  fastify.post(
    '/v1/auth/totp/verify',
    {
      config: { audience: 'admin' },
      schema: { body: TotpVerifySchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof TotpVerifySchema> }>, reply: FastifyReply) => {
      if (!req.user) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const { code } = req.body;

      // Find pending factor
      const factors = await db
        .select()
        .from(totpFactors)
        .where(and(eq(totpFactors.userId, req.user.id), eq(totpFactors.isVerified, false)))
        .limit(1);

      const factor = factors[0];
      if (!factor) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Bad Request',
          status: 400,
          detail: 'No pending TOTP factor found to verify',
        });
      }

      const valid = verifyTotpCode(code, factor.secret);

      if (!valid) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Verification Failed',
          status: 400,
          detail: 'Invalid 6-digit TOTP code',
        });
      }

      // Mark factor as verified
      await db.update(totpFactors).set({ isVerified: true }).where(eq(totpFactors.id, factor.id));

      // Generate 10 single-use emergency recovery codes
      const { codes, pairs } = generateRecoveryCodes(10);
      for (const pair of pairs) {
        await db.insert(recoveryCodes).values({
          userId: req.user.id,
          codeHash: pair.hash,
          createdAt: new Date(),
        });
      }

      await recordAuthEvent(db, {
        action: 'auth.step_up.success',
        actorId: req.user.id,
        actorEmail: req.user.email,
        ipAddress: req.ip,
        changes: { mfaEnabled: true },
      });

      return reply.status(200).send({
        success: true,
        message: 'Two-factor TOTP activated successfully',
        recoveryCodes: codes,
      });
    }
  );

  // 8. Emergency Recovery Code Verification
  fastify.post(
    '/v1/auth/recovery/verify',
    {
      config: { audience: 'public', rateLimitClass: 'auth' },
      schema: { body: RecoveryVerifySchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof RecoveryVerifySchema> }>, reply: FastifyReply) => {
      const { email, recoveryCode } = req.body;
      const normalizedEmail = email.trim().toLowerCase();
      const codeHash = hashRecoveryCode(recoveryCode);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user || !user.isActive) {
        await authRateLimiter.recordFailure(req.ip);
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid recovery code or account disabled',
        });
      }

      // Check unused recovery code
      const matchingCodes = await db
        .select()
        .from(recoveryCodes)
        .where(and(eq(recoveryCodes.userId, user.id), eq(recoveryCodes.codeHash, codeHash)))
        .limit(1);

      const matchedCode = matchingCodes[0];
      if (!matchedCode || matchedCode.usedAt) {
        await authRateLimiter.recordFailure(req.ip);
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Recovery code has already been used or is invalid',
        });
      }

      // Consume recovery code
      await db
        .update(recoveryCodes)
        .set({ usedAt: new Date() })
        .where(eq(recoveryCodes.id, matchedCode.id));

      authRateLimiter.recordSuccess(req.ip);

      // Create session
      const { rawToken } = await createSession(db, {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      setSessionCookie(reply, rawToken, req);

      await recordAuthEvent(db, {
        action: 'auth.recovery_code.used',
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: req.ip,
      });

      const csrfToken = generateCsrfToken(rawToken);

      return reply.status(200).send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          countryScopes: user.countryScopes,
        },
        token: rawToken,
        csrfToken,
      });
    }
  );

  // 9. Session Step-Up Authentication
  fastify.post(
    '/v1/auth/step-up',
    {
      config: { audience: 'admin' },
      schema: { body: StepUpSchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof StepUpSchema> }>, reply: FastifyReply) => {
      if (!req.user || !req.rawSessionToken) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const { totpCode } = req.body;

      if (!totpCode) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Bad Request',
          status: 400,
          detail: 'Step-up authentication code required',
        });
      }

      const factors = await db
        .select()
        .from(totpFactors)
        .where(and(eq(totpFactors.userId, req.user.id), eq(totpFactors.isVerified, true)))
        .limit(1);

      const activeFactor = factors[0];
      if (!activeFactor || !verifyTotpCode(totpCode, activeFactor.secret)) {
        await recordAuthEvent(db, {
          action: 'auth.step_up.failure',
          actorId: req.user.id,
          ipAddress: req.ip,
        });
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Step-up Failed',
          status: 401,
          detail: 'Invalid verification code',
        });
      }

      // Elevate and rotate session
      const steppedUp = await stepUpSession(db, req.rawSessionToken, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      if (!steppedUp) {
        return reply.status(500).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to elevate session',
        });
      }

      setSessionCookie(reply, steppedUp.rawToken, req);

      await recordAuthEvent(db, {
        action: 'auth.step_up.success',
        actorId: req.user.id,
        actorEmail: req.user.email,
        ipAddress: req.ip,
      });

      const csrfToken = generateCsrfToken(steppedUp.rawToken);

      return reply.status(200).send({
        success: true,
        isStepUpActive: true,
        token: steppedUp.rawToken,
        csrfToken,
        stepUpUntil: steppedUp.session.stepUpUntil,
      });
    }
  );

  // 10. Logout & Remote Revocation
  fastify.post(
    '/v1/auth/logout',
    {
      config: { audience: 'public' },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (req.rawSessionToken) {
        await revokeSession(db, req.rawSessionToken);
        if (req.user) {
          await recordAuthEvent(db, {
            action: 'auth.logout',
            actorId: req.user.id,
            actorEmail: req.user.email,
            ipAddress: req.ip,
          });
        }
      }

      clearSessionCookie(reply, req);

      return reply.status(200).send({ success: true, message: 'Logged out successfully' });
    }
  );

  // 11. Current User Profile (/me)
  fastify.get(
    '/v1/auth/me',
    {
      config: { audience: 'admin' },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.user || !req.session) {
        return reply.status(401).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      const csrfToken = req.rawSessionToken ? generateCsrfToken(req.rawSessionToken) : null;

      return reply.status(200).send({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          countryScopes: req.user.countryScopes,
        },
        session: {
          id: req.session.id,
          expiresAt: req.session.expiresAt,
          lastActiveAt: req.session.lastActiveAt,
          stepUpUntil: req.session.stepUpUntil,
        },
        isStepUp: req.isStepUp,
        csrfToken,
      });
    }
  );

  // 12. Create Staff Invitation
  fastify.post(
    '/v1/auth/invitations',
    {
      config: {
        audience: 'admin',
        permission: PERMISSIONS.ADMIN_WRITE_USERS,
      },
      schema: { body: CreateInvitationSchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof CreateInvitationSchema> }>, reply: FastifyReply) => {
      const { email, role, countryScopes } = req.body;

      const { rawToken, invitation } = await createStaffInvitation(db, {
        email,
        role,
        countryScopes,
        invitedBy: req.user?.id || null,
      });

      await recordAuthEvent(db, {
        action: 'auth.invitation.created',
        actorId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        resourceId: invitation.id,
        ipAddress: req.ip,
        changes: { invitedEmail: email, role },
      });

      return reply.status(201).send({
        success: true,
        invitationId: invitation.id,
        email: invitation.email,
        token: rawToken,
        expiresAt: invitation.expiresAt,
      });
    }
  );

  // 13. Accept Staff Invitation
  fastify.post(
    '/v1/auth/invitations/accept',
    {
      config: { audience: 'public', rateLimitClass: 'auth' },
      schema: { body: AcceptInvitationSchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof AcceptInvitationSchema> }>, reply: FastifyReply) => {
      const { token, name, password } = req.body;

      const result = await acceptStaffInvitation(db, {
        rawToken: token,
        name,
        password,
      });

      if (!result.success || !result.user) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Invitation Error',
          status: 400,
          detail: result.error || 'Failed to accept invitation',
        });
      }

      const user = result.user;

      // Issue initial session
      const { rawToken } = await createSession(db, {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      setSessionCookie(reply, rawToken, req);

      await recordAuthEvent(db, {
        action: 'auth.invitation.accepted',
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        ipAddress: req.ip,
      });

      const csrfToken = generateCsrfToken(rawToken);

      return reply.status(200).send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          countryScopes: user.countryScopes,
        },
        token: rawToken,
        csrfToken,
      });
    }
  );

  // 14. Submitter Capability Token Exchange
  fastify.post(
    '/v1/auth/capability/exchange',
    {
      config: { audience: 'public' },
      schema: { body: CapabilityExchangeSchema },
    },
    async (req: FastifyRequest<{ Body: z.infer<typeof CapabilityExchangeSchema> }>, reply: FastifyReply) => {
      const { token } = req.body;

      const exchangeResult = await exchangeCapabilityToken(db, token);

      if (!exchangeResult.success || !exchangeResult.submission) {
        return reply.status(400).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Capability Token Exchange Failed',
          status: 400,
          detail: exchangeResult.error || 'Invalid or consumed capability token',
        });
      }

      return reply.status(200).send({
        success: true,
        submission: exchangeResult.submission,
        newCapabilityToken: exchangeResult.newCapabilityToken,
      });
    }
  );
};
