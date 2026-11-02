import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { env } from '../config/env.js';

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Derives a deterministic session-bound CSRF token from the raw session token.
 */
export function generateCsrfToken(rawSessionToken: string): string {
  return createHmac('sha256', env.SESSION_SECRET)
    .update(`wh_csrf:${rawSessionToken}`)
    .digest('hex');
}

/**
 * Validates a session-bound CSRF token using timing-safe comparison.
 */
export function verifyCsrfToken(rawSessionToken: string, providedToken: string): boolean {
  if (!rawSessionToken || !providedToken || typeof providedToken !== 'string') {
    return false;
  }

  const expectedToken = generateCsrfToken(rawSessionToken);
  if (expectedToken.length !== providedToken.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expectedToken), Buffer.from(providedToken));
  } catch {
    return false;
  }
}

/**
 * Validates state-changing HTTP requests against CSRF attacks using Origin,
 * Sec-Fetch-Site headers, and optional session-bound token matching.
 */
export function validateCsrf(req: FastifyRequest, rawSessionToken?: string | null): CsrfValidationResult {
  const method = req.method.toUpperCase();

  // Safe idempotent methods do not mutate state
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { valid: true };
  }

  // 1. Sec-Fetch-Site header check (modern browser defense-in-depth)
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    return {
      valid: false,
      reason: 'Cross-site request blocked by Sec-Fetch-Site policy',
    };
  }

  // 2. Origin & Referer validation
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim().toLowerCase());
  if (env.WEBAUTHN_ORIGIN) {
    allowedOrigins.push(env.WEBAUTHN_ORIGIN.trim().toLowerCase());
  }

  const originHeader = req.headers.origin;
  if (originHeader) {
    const originNormalized = originHeader.trim().toLowerCase();
    const isAllowed =
      allowedOrigins.includes(originNormalized) ||
      (env.NODE_ENV === 'development' && originNormalized.includes('localhost'));

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Origin '${originHeader}' is not in the allowed CORS/CSRF origin list`,
      };
    }
  } else {
    // If Origin is missing, inspect Referer header
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = refererUrl.origin.toLowerCase();
        const isAllowed =
          allowedOrigins.includes(refererOrigin) ||
          (env.NODE_ENV === 'development' && refererOrigin.includes('localhost'));

        if (!isAllowed) {
          return {
            valid: false,
            reason: `Referer origin '${refererOrigin}' is not allowed`,
          };
        }
      } catch {
        return {
          valid: false,
          reason: 'Malformed Referer header received',
        };
      }
    }
  }

  // 3. Optional session-bound CSRF token verification (if provided via x-csrf-token)
  const csrfHeader = req.headers['x-csrf-token'] as string | undefined;
  if (csrfHeader && rawSessionToken) {
    if (!verifyCsrfToken(rawSessionToken, csrfHeader)) {
      return {
        valid: false,
        reason: 'Invalid or forged session-bound CSRF token',
      };
    }
  }

  return { valid: true };
}

