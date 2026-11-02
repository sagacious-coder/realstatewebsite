import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const developers = pgTable('developers', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  logo: text('logo'),
  description: text('description'),
  foundedYear: integer('founded_year'),
  website: text('website'),
  activeProjects: integer('active_projects').default(0).notNull(),
  escrowCertified: boolean('escrow_certified').default(true).notNull(),
  operatingMarkets: text('operating_markets')
    .array()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export type DeveloperRow = typeof developers.$inferSelect;
export type NewDeveloperRow = typeof developers.$inferInsert;
