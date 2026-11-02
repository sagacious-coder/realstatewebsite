import { auditLog } from '../db/schema/audit.js';

export type AuthAction =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.session.rotated'
  | 'auth.step_up.success'
  | 'auth.step_up.failure'
  | 'auth.passkey.registered'
  | 'auth.passkey.authenticated'
  | 'auth.invitation.created'
  | 'auth.invitation.accepted'
  | 'auth.recovery_code.used'
  | 'auth.rate_limit.locked';

export interface RecordAuthEventOptions {
  action: AuthAction;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  changes?: Record<string, any> | null;
}

/**
 * Appends an immutable audit event to the audit_log table.
 * Automatically redacts sensitive fields before persisting.
 */
export async function recordAuthEvent(
  db: any,
  options: RecordAuthEventOptions
): Promise<void> {
  const sanitizedChanges = { ...(options.changes || {}) };

  // Never persist credentials or tokens in audit logs
  delete sanitizedChanges.password;
  delete sanitizedChanges.passwordHash;
  delete sanitizedChanges.secret;
  delete sanitizedChanges.rawToken;
  delete sanitizedChanges.token;
  delete sanitizedChanges.code;

  try {
    await db.insert(auditLog).values({
      actorId: options.actorId || null,
      actorEmail: options.actorEmail || null,
      actorRole: options.actorRole || null,
      action: options.action,
      resourceType: 'auth',
      resourceId: options.resourceId || options.actorId || null,
      changes: sanitizedChanges,
      ipAddress: options.ipAddress || null,
      createdAt: new Date(),
    });
  } catch (err) {
    // Audit logs must not throw and crash requests, but report in logger
    console.error('Failed to append to audit log:', err);
  }
}

