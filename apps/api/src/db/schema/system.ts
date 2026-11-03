import {
  pgTable,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const exchangeRates = pgTable('exchange_rates', {
  base: varchar('base', { length: 3 }).primaryKey().default('USD'),
  rates: jsonb('rates').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const usageCounters = pgTable('usage_counters', {
  date: text('date').primaryKey(), // YYYY-MM-DD
  emailCount: integer('email_count').default(0).notNull(),
  storageBytes: bigint('storage_bytes', { mode: 'number' }).default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const idempotencyRecords = pgTable('idempotency_records', {
  key: text('key').primaryKey(),
  endpoint: text('endpoint').notNull(),
  responseBody: jsonb('response_body').notNull(),
  statusCode: integer('status_code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  recipient: text('recipient').notNull(),
  sender: text('sender').default('noreply@wildhills.com').notNull(),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  text: text('text'),
  priority: varchar('priority', { length: 2 }).default('P1').notNull(),
  status: text('status').default('pending').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true, mode: 'date' }),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
  attempts: integer('attempts').default(0).notNull(),
  error: text('error'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type ExchangeRateRow = typeof exchangeRates.$inferSelect;
export type UsageCounterRow = typeof usageCounters.$inferSelect;
export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
export type NewIdempotencyRecordRow = typeof idempotencyRecords.$inferInsert;
export type EmailOutboxRow = typeof emailOutbox.$inferSelect;
export type NewEmailOutboxRow = typeof emailOutbox.$inferInsert;

