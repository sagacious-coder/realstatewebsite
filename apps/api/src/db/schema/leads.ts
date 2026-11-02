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
import { listings } from './listings.js';
import { users } from './users.js';

export const leads = pgTable('leads', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  type: text('type').default('inquiry').notNull(), // 'inquiry' | 'viewing' | 'brochure' | 'contact'
  status: text('status').default('new').notNull(), // 'new' | 'contacted' | 'qualified' | 'closed_won' | etc.
  listingId: uuid('listing_id').references(() => listings.id, {
    onDelete: 'set null',
  }),
  propertyRef: text('property_ref'),
  propertyTitle: text('property_title'),
  budgetMin: bigint('budget_min', { mode: 'number' }),
  budgetMax: bigint('budget_max', { mode: 'number' }),
  currency: varchar('currency', { length: 3 }),
  message: text('message'),
  locale: varchar('locale', { length: 5 }).default('en').notNull(),
  preferredContact: text('preferred_contact').default('whatsapp').notNull(),
  consentGiven: boolean('consent_given').default(true).notNull(),
  utmSource: text('utm_source'),
  utmCampaign: text('utm_campaign'),
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export const leadNotes = pgTable('lead_notes', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  leadId: uuid('lead_id')
    .references(() => leads.id, { onDelete: 'cascade' })
    .notNull(),
  authorId: uuid('author_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  sellerName: text('seller_name').notNull(),
  sellerEmail: text('seller_email').notNull(),
  sellerPhone: text('seller_phone').notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  city: text('city').notNull(),
  area: text('area'),
  propertyType: text('property_type').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: numeric('bathrooms', { precision: 3, scale: 1 }).notNull(),
  sizeSqm: numeric('size_sqm', { precision: 10, scale: 2 }).notNull(),
  expectedPriceMinor: bigint('expected_price_minor', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  description: text('description'),
  notes: text('notes'),
  status: text('status').default('pending').notNull(), // 'pending' | 'reviewing' | 'approved' | 'rejected'
  capabilityToken: text('capability_token'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  version: integer('version').default(1).notNull(),
});

export const submissionDocuments = pgTable('submission_documents', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  submissionId: uuid('submission_id')
    .references(() => submissions.id, { onDelete: 'cascade' })
    .notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  contentType: text('content_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;
export type LeadNoteRow = typeof leadNotes.$inferSelect;
export type SubmissionRow = typeof submissions.$inferSelect;
export type NewSubmissionRow = typeof submissions.$inferInsert;
export type SubmissionDocumentRow = typeof submissionDocuments.$inferSelect;
