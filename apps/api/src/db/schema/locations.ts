import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  bigint,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const locations = pgTable('locations', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  slug: text('slug').notNull().unique(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  type: text('type').notNull(), // 'country' | 'region' | 'city' | 'area'
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  image: text('image'),
  bannerImage: text('banner_image'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  isFeatured: boolean('is_featured').default(false).notNull(),
  featuredOrder: integer('featured_order'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  investmentScore: integer('investment_score'),
  avgPriceSqm: bigint('avg_price_sqm', { mode: 'number' }),
  rentalYieldMin: numeric('rental_yield_min', { precision: 4, scale: 2 }),
  rentalYieldMax: numeric('rental_yield_max', { precision: 4, scale: 2 }),
  capitalAppreciation: numeric('capital_appreciation', { precision: 4, scale: 2 }),
  totalProjects: integer('total_projects').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export type LocationRow = typeof locations.$inferSelect;
export type NewLocationRow = typeof locations.$inferInsert;

