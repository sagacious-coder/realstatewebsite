import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').default('agent').notNull(), // 'owner' | 'admin' | 'agent' | 'editor'
  isActive: boolean('is_active').default(true).notNull(),
  countryScopes: text('country_scopes')
    .array()
    .default([])
    .notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // Cryptographic token hash
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  stepUpUntil: timestamp('step_up_until', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const passkeys = pgTable('passkeys', {
  id: text('id').primaryKey(), // WebAuthn Credential ID
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).default(0).notNull(),
  deviceType: text('device_type'),
  backedUp: boolean('backed_up').default(false).notNull(),
  transports: text('transports')
    .array()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const totpFactors = pgTable('totp_factors', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  secret: text('secret').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const invitations = pgTable('invitations', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text('email').notNull(),
  role: text('role').default('agent').notNull(),
  countryScopes: text('country_scopes')
    .array()
    .default([])
    .notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const recoveryCodes = pgTable('recovery_codes', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  codeHash: text('code_hash').notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  challenge: text('challenge').notNull(),
  type: text('type').notNull(), // 'registration' | 'authentication'
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type PasskeyRow = typeof passkeys.$inferSelect;
export type TotpFactorRow = typeof totpFactors.$inferSelect;
export type InvitationRow = typeof invitations.$inferSelect;
export type RecoveryCodeRow = typeof recoveryCodes.$inferSelect;
export type WebauthnChallengeRow = typeof webauthnChallenges.$inferSelect;

