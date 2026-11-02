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
  jsonb,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { locations } from './locations.js';
import { developers } from './developers.js';
import { projects } from './projects.js';

export const listings = pgTable('listings', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  refNumber: text('ref_number').notNull().unique(), // e.g. 'WH-AE-101'
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, {
    onDelete: 'set null',
  }),
  city: text('city').notNull(),
  area: text('area'),
  developerId: uuid('developer_id').references(() => developers.id, {
    onDelete: 'set null',
  }),
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  propertyType: text('property_type').notNull(), // 'apartment' | 'villa' | etc.
  status: text('status').default('ready').notNull(), // 'ready' | 'under_construction' | 'off_plan'
  reviewStatus: text('review_status').default('published').notNull(), // 'draft' | 'pending' | 'published' | 'archived'
  priceMinor: bigint('price_minor', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  priceUsdMinor: bigint('price_usd_minor', { mode: 'number' }).notNull(),
  bedrooms: integer('bedrooms').default(0).notNull(),
  bathrooms: numeric('bathrooms', { precision: 3, scale: 1 }).default('1').notNull(),
  sizeSqm: numeric('size_sqm', { precision: 10, scale: 2 }).notNull(),
  sizeSqft: numeric('size_sqft', { precision: 10, scale: 2 }).notNull(),
  coverImage: text('cover_image').notNull(),
  isHotDeal: boolean('is_hot_deal').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  isNewLaunch: boolean('is_new_launch').default(false).notNull(),
  isSample: boolean('is_sample').default(true).notNull(),
  completionYear: integer('completion_year'),
  furnishingStatus: text('furnishing_status'),
  badges: text('badges')
    .array()
    .default([])
    .notNull(),
  features: text('features')
    .array()
    .default([])
    .notNull(),
  videoUrl: text('video_url'),
  virtualTourUrl: text('virtual_tour_url'),
  floorPlans: jsonb('floor_plans').default([]).notNull(),
  paymentPlan: jsonb('payment_plan'),
  agent: jsonb('agent').notNull(),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export const listingImages = pgTable('listing_images', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  listingId: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const listingTranslations = pgTable('listing_translations', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  listingId: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .notNull(),
  locale: varchar('locale', { length: 5 }).notNull(), // 'en' | 'ar' | 'tr' | 'ka'
  title: text('title').notNull(),
  description: text('description').notNull(),
  reviewStatus: text('review_status').default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const listingDocuments = pgTable('listing_documents', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  listingId: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  contentType: text('content_type').notNull(),
  isPrivate: boolean('is_private').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;
export type ListingImageRow = typeof listingImages.$inferSelect;
export type ListingTranslationRow = typeof listingTranslations.$inferSelect;
export type ListingDocumentRow = typeof listingDocuments.$inferSelect;
