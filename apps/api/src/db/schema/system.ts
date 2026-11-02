import {
  pgTable,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

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

export type ExchangeRateRow = typeof exchangeRates.$inferSelect;
export type UsageCounterRow = typeof usageCounters.$inferSelect;
