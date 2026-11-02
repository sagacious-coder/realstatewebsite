import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import {
  getSessionTokenFromRequest,
  validateSession,
  validateCsrf,
  authRateLimiter,
  verifyCapabilityToken,
  authorize,
  type PolicyActor,
} from '../auth/index.js';
import type { SessionRow, UserRow } from '../db/schema/users.js';

declare module 'fastify' {
  interface FastifyRequest {
    actor: PolicyActor | null;
    session: SessionRow | null;
    user: UserRow | null;
    isStepUp: boolean;
    rawSessionToken: string | null;
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // 1. Register fastify-cookie
  await fastify.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {},
  });

  // 2. Decorate request object
  fastify.decorateRequest('actor', null);
  fastify.decorateRequest('session', null);
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('isStepUp', false);
  fastify.decorateRequest('rawSessionToken', null);

  // 3. Pre-handler hook: Resolve Identity, CSRF, and Permissions
  fastify.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    // A. Resolve Session / Identity
    const rawToken = getSessionTokenFromRequest(req);
    req.rawSessionToken = rawToken;

    if (rawToken) {
      try {
        const sessionCtx = await validateSession(db, rawToken);
        if (sessionCtx) {
          req.session = sessionCtx.session;
          req.user = sessionCtx.user;
          req.isStepUp = sessionCtx.isStepUpActive;
          req.actor = {
            userId: sessionCtx.user.id,
            role: sessionCtx.user.role as any,
            countryScopes: sessionCtx.user.countryScopes,
          };
        }
      } catch (err) {
        req.log.warn({ err }, 'Error resolving session');
      }
    }

    // B. Check Capability Token if no user session
    if (!req.actor) {
      const capHeader = req.headers['x-capability-token'] as string | undefined;
      if (capHeader) {
        const capVerification = verifyCapabilityToken(capHeader);
        if (capVerification.valid && capVerification.payload) {
          req.actor = {
            role: 'submitter',
            submissionToken: capVerification.payload.subId,
          };
        }
      }
    }

    // Default to public actor
    if (!req.actor) {
      req.actor = { role: 'public' };
    }

    const config = req.routeOptions.config;

    // C. Internal probes pass through without auth or CSRF overhead
    if (config?.audience === 'internal') {
      return;
    }

    // D. Check Rate Limiter for auth-classified routes
    if (config?.rateLimitClass === 'auth') {
      const checkResult = authRateLimiter.check(req.ip);
      if (checkResult.isLocked) {
        return reply.status(429).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Too Many Requests',
          status: 429,
          detail: `Account or IP temporarily locked due to repeated failed attempts. Retry in ${checkResult.remainingLockoutSeconds} seconds.`,
        });
      }
    }

    // D. CSRF Verification for state-changing operations
    const csrfResult = validateCsrf(req, req.rawSessionToken);
    if (!csrfResult.valid) {
      return reply.status(403).send({
        type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
        title: 'CSRF Validation Failed',
        status: 403,
        detail: csrfResult.reason || 'Forbidden state-changing request',
      });
    }

    // E. Audience & Permission Authorization
    if (config?.audience === 'admin' && req.actor.role === 'public') {
      return reply.status(401).send({
        type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Authentication required to access administrative resources',
      });
    }

    if (config?.permission) {
      const authResult = authorize(req.actor, config.permission);
      if (!authResult.allowed) {
        return reply.status(403).send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Forbidden',
          status: 403,
          detail: authResult.reason || 'You do not have permission to execute this operation',
        });
      }
    }
  });
});
