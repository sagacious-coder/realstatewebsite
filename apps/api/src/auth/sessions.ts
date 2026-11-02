import { randomBytes, createHash } from 'node:crypto';
import { eq, and, sql } from 'drizzle-orm';
import { sessions, users, type SessionRow, type UserRow } from '../db/schema/users.js';

export const SESSION_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours absolute timeout
export const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout
export const STEP_UP_DURATION_MS = 15 * 60 * 1000; // 15 minutes step-up validity

/**
 * Computes the cryptographic SHA-256 hash of a raw session token.
 */
export function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(`wh_sess:${rawToken}`).digest('hex');
}

/**
 * Generates a high-entropy 32-byte cryptographic random session token.
 */
export function generateRawSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export interface SessionContext {
  session: SessionRow;
  user: UserRow;
  isStepUpActive: boolean;
}

export interface CreateSessionOptions {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates and persists a new session with hashed token storage.
 */
export async function createSession(
  db: any,
  options: CreateSessionOptions
): Promise<{ rawToken: string; session: SessionRow }> {
  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);

  const [inserted] = await db
    .insert(sessions)
    .values({
      id: tokenHash,
      userId: options.userId,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      expiresAt,
      lastActiveAt: now,
      createdAt: now,
    })
    .returning();

  return { rawToken, session: inserted };
}

/**
 * Validates a session token, enforcing idle timeout, absolute timeout, and user active status.
 * Automatically updates `last_active_at` on successful validation.
 */
export async function validateSession(db: any, rawToken: string): Promise<SessionContext | null> {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  // Query session joined with user
  const results = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, tokenHash))
    .limit(1);

  if (!results.length) {
    return null;
  }

  const { session, user } = results[0];

  // 1. Check user is active
  if (!user.isActive) {
    await db.delete(sessions).where(eq(sessions.id, tokenHash));
    return null;
  }

  // 2. Check absolute timeout
  if (session.expiresAt.getTime() <= now.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, tokenHash));
    return null;
  }

  // 3. Check idle timeout
  const lastActiveTime = session.lastActiveAt ? session.lastActiveAt.getTime() : session.createdAt.getTime();
  if (now.getTime() - lastActiveTime > SESSION_IDLE_TIMEOUT_MS) {
    await db.delete(sessions).where(eq(sessions.id, tokenHash));
    return null;
  }

  // 4. Update last_active_at
  await db
    .update(sessions)
    .set({ lastActiveAt: now })
    .where(eq(sessions.id, tokenHash));

  // 5. Determine if step-up authentication is currently active
  const isStepUpActive = Boolean(
    session.stepUpUntil && session.stepUpUntil.getTime() > now.getTime()
  );

  return {
    session: { ...session, lastActiveAt: now },
    user,
    isStepUpActive,
  };
}

/**
 * Rotates a session: revokes the old session token and issues a fresh one,
 * preserving existing metadata and step-up status if valid.
 */
export async function rotateSession(
  db: any,
  oldRawToken: string,
  newMetadata?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<{ rawToken: string; session: SessionRow } | null> {
  const current = await validateSession(db, oldRawToken);
  if (!current) {
    return null;
  }

  const oldTokenHash = hashSessionToken(oldRawToken);
  // Delete the old session
  await db.delete(sessions).where(eq(sessions.id, oldTokenHash));

  // Generate new token
  const newRawToken = generateRawSessionToken();
  const newTokenHash = hashSessionToken(newRawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);

  const [newSession] = await db
    .insert(sessions)
    .values({
      id: newTokenHash,
      userId: current.user.id,
      ipAddress: newMetadata?.ipAddress ?? current.session.ipAddress,
      userAgent: newMetadata?.userAgent ?? current.session.userAgent,
      expiresAt,
      lastActiveAt: now,
      stepUpUntil: current.isStepUpActive ? current.session.stepUpUntil : null,
      createdAt: now,
    })
    .returning();

  return { rawToken: newRawToken, session: newSession };
}

/**
 * Elevates a session with step-up MFA verification for 15 minutes,
 * simultaneously rotating the session token to prevent session fixation.
 */
export async function stepUpSession(
  db: any,
  rawToken: string,
  metadata?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<{ rawToken: string; session: SessionRow } | null> {
  const current = await validateSession(db, rawToken);
  if (!current) {
    return null;
  }

  const oldTokenHash = hashSessionToken(rawToken);
  await db.delete(sessions).where(eq(sessions.id, oldTokenHash));

  const newRawToken = generateRawSessionToken();
  const newTokenHash = hashSessionToken(newRawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS);
  const stepUpUntil = new Date(now.getTime() + STEP_UP_DURATION_MS);

  const [elevatedSession] = await db
    .insert(sessions)
    .values({
      id: newTokenHash,
      userId: current.user.id,
      ipAddress: metadata?.ipAddress ?? current.session.ipAddress,
      userAgent: metadata?.userAgent ?? current.session.userAgent,
      expiresAt,
      lastActiveAt: now,
      stepUpUntil,
      createdAt: now,
    })
    .returning();

  return { rawToken: newRawToken, session: elevatedSession };
}

/**
 * Revokes a single session by raw token or token hash.
 */
export async function revokeSession(db: any, rawTokenOrHash: string): Promise<boolean> {
  const tokenHash = hashSessionToken(rawTokenOrHash);
  const deleted = await db.delete(sessions).where(eq(sessions.id, tokenHash)).returning();
  if (deleted.length > 0) return true;
  const directDeleted = await db.delete(sessions).where(eq(sessions.id, rawTokenOrHash)).returning();
  return directDeleted.length > 0;
}

/**
 * Revokes all sessions belonging to a specific user (optionally preserving a current session).
 */
export async function revokeAllUserSessions(
  db: any,
  userId: string,
  exceptRawToken?: string
): Promise<number> {
  if (exceptRawToken) {
    const exceptHash = hashSessionToken(exceptRawToken);
    const deleted = await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), sql`${sessions.id} <> ${exceptHash}`))
      .returning();
    return deleted.length;
  }

  const deleted = await db.delete(sessions).where(eq(sessions.userId, userId)).returning();
  return deleted.length;
}
