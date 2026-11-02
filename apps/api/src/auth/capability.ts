import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { submissions, type SubmissionRow } from '../db/schema/leads.js';

export interface CapabilityTokenPayload {
  subId: string; // Submission ID
  email: string;
  nonce: string;
  iat: number; // Issued at (seconds)
  exp: number; // Expires at (seconds)
}

export const CAPABILITY_TOKEN_VALIDITY_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Encodes a buffer or string to URL-safe base64 without padding.
 */
function base64UrlEncode(data: string | Buffer): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes a URL-safe base64 string.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Computes an HMAC-SHA256 signature for the given payload string.
 */
function signPayload(payloadStr: string, secret = env.SESSION_SECRET): string {
  const hmac = createHmac('sha256', secret).update(payloadStr).digest();
  return base64UrlEncode(hmac);
}

/**
 * Mints a cryptographically signed capability token for a property submission.
 */
export function mintCapabilityToken(
  submissionId: string,
  email: string,
  validitySeconds = CAPABILITY_TOKEN_VALIDITY_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('hex');

  const payload: CapabilityTokenPayload = {
    subId: submissionId,
    email: email.toLowerCase().trim(),
    nonce,
    iat: now,
    exp: now + validitySeconds,
  };

  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadStr);

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies the cryptographic signature and expiration of a capability token.
 */
export function verifyCapabilityToken(token: string): {
  valid: boolean;
  payload?: CapabilityTokenPayload;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token must be a non-empty string' };
  }

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: 'Malformed capability token structure' };
  }

  const payloadStr = parts[0];
  const signature = parts[1];
  const expectedSignature = signPayload(payloadStr);

  // Timing-safe signature comparison
  if (expectedSignature.length !== signature.length) {
    return { valid: false, error: 'Invalid capability token signature' };
  }

  const isValidSig = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!isValidSig) {
    return { valid: false, error: 'Capability token signature mismatch' };
  }

  try {
    const payload: CapabilityTokenPayload = JSON.parse(base64UrlDecode(payloadStr));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return { valid: false, error: 'Capability token has expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid capability token payload encoding' };
  }
}

/**
 * Exchanges a capability token for authenticated single-use submission access,
 * validating the token against the database and rotating it to enforce single-use.
 */
export async function exchangeCapabilityToken(
  db: any,
  token: string
): Promise<{
  success: boolean;
  submission?: SubmissionRow;
  newCapabilityToken?: string;
  error?: string;
}> {
  const verification = verifyCapabilityToken(token);
  if (!verification.valid || !verification.payload) {
    return { success: false, error: verification.error || 'Token verification failed' };
  }

  const { subId, email } = verification.payload;

  // Retrieve matching submission from database
  const matchingSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, subId))
    .limit(1);

  if (!matchingSubmissions.length) {
    return { success: false, error: 'Submission not found' };
  }

  const submission = matchingSubmissions[0];

  // Verify stored capability token matches
  if (submission.capabilityToken !== token) {
    return { success: false, error: 'Capability token is invalid or has already been used' };
  }

  // Verify email matches
  if (submission.sellerEmail.toLowerCase() !== email.toLowerCase()) {
    return { success: false, error: 'Seller identity mismatch' };
  }

  // Enforce single-use: Mint a new capability token and rotate it in the database
  const newCapabilityToken = mintCapabilityToken(subId, email);

  const [updated] = await db
    .update(submissions)
    .set({
      capabilityToken: newCapabilityToken,
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, subId))
    .returning();

  return {
    success: true,
    submission: updated,
    newCapabilityToken,
  };
}
