import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import { SESSION_ABSOLUTE_TIMEOUT_MS } from './sessions.js';

export const SECURE_COOKIE_NAME = '__Host-wh_session';
export const INSECURE_COOKIE_NAME = 'wh_session';

/**
 * Determines whether the current request is operating over a secure (HTTPS) transport.
 */
export function isRequestSecure(req: FastifyRequest): boolean {
  if (env.NODE_ENV === 'production') {
    return true;
  }
  const proto = req.headers['x-forwarded-proto'];
  if (proto === 'https') {
    return true;
  }
  return req.protocol === 'https';
}

/**
 * Gets the preferred cookie name based on transport security.
 */
export function getSessionCookieName(req: FastifyRequest): string {
  return isRequestSecure(req) ? SECURE_COOKIE_NAME : INSECURE_COOKIE_NAME;
}

/**
 * Sets a hardened HTTP-only session cookie on the outgoing response.
 */
export function setSessionCookie(
  reply: FastifyReply,
  rawToken: string,
  req: FastifyRequest
): void {
  const isSecure = isRequestSecure(req);
  const cookieName = isSecure ? SECURE_COOKIE_NAME : INSECURE_COOKIE_NAME;

  reply.setCookie(cookieName, rawToken, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_ABSOLUTE_TIMEOUT_MS / 1000), // in seconds
  });
}

/**
 * Extracts the raw session token from cookies or the Authorization header.
 */
export function getSessionTokenFromRequest(req: FastifyRequest): string | null {
  // 1. Check cookies (secure first, then dev fallback)
  if (req.cookies) {
    if (req.cookies[SECURE_COOKIE_NAME]) {
      return req.cookies[SECURE_COOKIE_NAME]!;
    }
    if (req.cookies[INSECURE_COOKIE_NAME]) {
      return req.cookies[INSECURE_COOKIE_NAME]!;
    }
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Clears the session cookie from the client.
 */
export function clearSessionCookie(reply: FastifyReply, req: FastifyRequest): void {
  const isSecure = isRequestSecure(req);
  reply.clearCookie(SECURE_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
  });
  reply.clearCookie(INSECURE_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
}

