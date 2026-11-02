import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  bigint,
  timestamp,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { developers } from './developers.js';
import { locations } from './locations.js';

export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  developerId: uuid('developer_id').references(() => developers.id, {
    onDelete: 'set null',
  }),
  locationId: uuid('location_id').references(() => locations.id, {
    onDelete: 'set null',
  }),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  description: text('description'),
  status: text('status').default('under_construction').notNull(),
  completionYear: integer('completion_year'),
  startingPriceMinor: bigint('starting_price_minor', { mode: 'number' }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
