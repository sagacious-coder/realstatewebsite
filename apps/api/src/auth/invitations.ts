import { randomBytes, createHash } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { invitations, users, passkeys, type InvitationRow, type UserRow } from '../db/schema/users.js';
import { hashPassword } from './passwords.js';

export const INVITATION_EXPIRATION_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Computes the SHA-256 hash of a raw invitation token.
 */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(`wh_invite:${token}`).digest('hex');
}

export interface CreateInvitationParams {
  email: string;
  role: 'admin' | 'agent' | 'editor';
  countryScopes?: string[];
  invitedBy?: string | null;
}

export interface AcceptInvitationParams {
  rawToken: string;
  name: string;
  password?: string;
  passkey?: {
    id: string;
    publicKey: string;
    counter?: number;
    deviceType?: string;
    backedUp?: boolean;
    transports?: string[];
  };
}

/**
 * Creates and persists a new staff invitation with a cryptographically secure token.
 */
export async function createStaffInvitation(
  db: any,
  params: CreateInvitationParams
): Promise<{ rawToken: string; invitation: InvitationRow }> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashInvitationToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRATION_MS);

  const [invitation] = await db
    .insert(invitations)
    .values({
      email: params.email.trim().toLowerCase(),
      role: params.role,
      countryScopes: params.countryScopes || [],
      tokenHash,
      invitedBy: params.invitedBy || null,
      expiresAt,
      createdAt: now,
    })
    .returning();

  return { rawToken, invitation };
}

/**
 * Validates an invitation token and returns the invitation record if active and unexpired.
 */
export async function validateStaffInvitation(db: any, rawToken: string): Promise<InvitationRow | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashInvitationToken(rawToken);
  const now = new Date();

  const results = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.tokenHash, tokenHash)))
    .limit(1);

  if (!results.length) return null;

  const inv = results[0];
  if (inv.acceptedAt) return null; // Already used
  if (inv.expiresAt.getTime() <= now.getTime()) return null; // Expired

  return inv;
}

/**
 * Accepts a staff invitation, creating the user record, credentials, and marking the invitation as accepted.
 */
export async function acceptStaffInvitation(
  db: any,
  params: AcceptInvitationParams
): Promise<{ success: boolean; user?: UserRow; error?: string }> {
  const invitation = await validateStaffInvitation(db, params.rawToken);
  if (!invitation) {
    return { success: false, error: 'Invitation token is invalid, expired, or already accepted' };
  }

  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);

  if (existingUsers.length > 0) {
    return { success: false, error: 'A user account with this email already exists' };
  }

  let passwordHash: string | null = null;
  if (params.password) {
    passwordHash = await hashPassword(params.password);
  }

  const now = new Date();

  // Create user
  const [createdUser] = await db
    .insert(users)
    .values({
      email: invitation.email,
      name: params.name.trim(),
      role: invitation.role,
      isActive: true,
      countryScopes: invitation.countryScopes,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // If a passkey was provided during onboarding, register it
  if (params.passkey) {
    await db.insert(passkeys).values({
      id: params.passkey.id,
      userId: createdUser.id,
      publicKey: params.passkey.publicKey,
      counter: params.passkey.counter ?? 0,
      deviceType: params.passkey.deviceType || null,
      backedUp: params.passkey.backedUp ?? false,
      transports: params.passkey.transports || [],
      createdAt: now,
    });
  }

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ acceptedAt: now })
    .where(eq(invitations.id, invitation.id));

  return { success: true, user: createdUser };
}

