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

export const publicLocations = pgTable('public_locations', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  type: text('type').notNull(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  image: text('image'),
  bannerImage: text('banner_image'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  isFeatured: boolean('is_featured').notNull(),
  featuredOrder: integer('featured_order'),
  isPinned: boolean('is_pinned').notNull(),
  investmentScore: integer('investment_score'),
  avgPriceSqm: bigint('avg_price_sqm', { mode: 'number' }),
  rentalYieldMin: numeric('rental_yield_min', { precision: 4, scale: 2 }),
  rentalYieldMax: numeric('rental_yield_max', { precision: 4, scale: 2 }),
  capitalAppreciation: numeric('capital_appreciation', { precision: 4, scale: 2 }),
  totalProjects: integer('total_projects').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  version: integer('version').notNull(),
});

export const publicDevelopers = pgTable('public_developers', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  logo: text('logo'),
  description: text('description'),
  foundedYear: integer('founded_year'),
  website: text('website'),
  activeProjects: integer('active_projects').notNull(),
  escrowCertified: boolean('escrow_certified').notNull(),
  operatingMarkets: text('operating_markets')
    .array()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  version: integer('version').notNull(),
});

export const publicProjects = pgTable('public_projects', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  developerId: uuid('developer_id'),
  locationId: uuid('location_id'),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  description: text('description'),
  status: text('status').notNull(),
  completionYear: integer('completion_year'),
  startingPriceMinor: bigint('starting_price_minor', { mode: 'number' }),
  currency: varchar('currency', { length: 3 }).notNull(),
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  version: integer('version').notNull(),
});

export const publicListings = pgTable('public_listings', {
  id: uuid('id').primaryKey(),
  refNumber: text('ref_number').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  locationId: uuid('location_id'),
  city: text('city').notNull(),
  area: text('area'),
  developerId: uuid('developer_id'),
  projectId: uuid('project_id'),
  propertyType: text('property_type').notNull(),
  status: text('status').notNull(),
  reviewStatus: text('review_status').notNull(),
  priceMinor: bigint('price_minor', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  priceUsdMinor: bigint('price_usd_minor', { mode: 'number' }).notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: numeric('bathrooms', { precision: 3, scale: 1 }).notNull(),
  sizeSqm: numeric('size_sqm', { precision: 10, scale: 2 }).notNull(),
  sizeSqft: numeric('size_sqft', { precision: 10, scale: 2 }).notNull(),
  coverImage: text('cover_image').notNull(),
  isHotDeal: boolean('is_hot_deal').notNull(),
  isFeatured: boolean('is_featured').notNull(),
  isVerified: boolean('is_verified').notNull(),
  isNewLaunch: boolean('is_new_launch').notNull(),
  isSample: boolean('is_sample').notNull(),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }).notNull(),
  version: integer('version').notNull(),
});

export const publicListingImages = pgTable('public_listing_images', {
  id: uuid('id').primaryKey(),
  listingId: uuid('listing_id').notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const publicRates = pgTable('public_rates', {
  base: varchar('base', { length: 3 }).primaryKey(),
  rates: jsonb('rates').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export type PublicLocationRow = typeof publicLocations.$inferSelect;
export type PublicDeveloperRow = typeof publicDevelopers.$inferSelect;
export type PublicProjectRow = typeof publicProjects.$inferSelect;
export type PublicListingRow = typeof publicListings.$inferSelect;
export type PublicListingImageRow = typeof publicListingImages.$inferSelect;
export type PublicRatesRow = typeof publicRates.$inferSelect;

