import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const auditLog = pgTable('audit_log', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  actorId: uuid('actor_id'),
  actorEmail: text('actor_email'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  changes: jsonb('changes'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLogRow = typeof auditLog.$inferInsert;

