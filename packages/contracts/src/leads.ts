import { z } from 'zod';
import {
  CountryCodeSchema,
  CurrencyCodeSchema,
  LeadStatusSchema,
  LeadTypeSchema,
  LocaleSchema,
  PropertyTypeSchema,
  SubmissionStatusSchema,
  type LeadStatus,
  type SubmissionStatus,
} from './enums.js';

export const LeadCreateSchema = z
  .object({
    name: z.string().min(2).max(100).describe('Full name of the inquirer'),
    email: z.string().email().describe('Contact email address'),
    phone: z.string().min(7).max(25).describe('International phone number with country code'),
    countryCode: CountryCodeSchema.describe('Target country code'),
    type: LeadTypeSchema.default('inquiry'),
    listingId: z.string().optional().describe('Referenced listing UUID if inquiring on a specific property'),
    propertyRef: z.string().optional().describe('Referenced listing human code, e.g. WH-AE-101'),
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().nonnegative().optional(),
    currency: CurrencyCodeSchema.optional(),
    message: z.string().max(2000).optional(),
    locale: LocaleSchema.optional().default('en'),
    preferredContact: z.enum(['whatsapp', 'phone', 'email']).optional().default('whatsapp'),
    consentGiven: z.literal(true, {
      message: 'You must agree to the privacy policy and consent to be contacted',
    }),
  })
  .strict();

export type LeadCreate = z.infer<typeof LeadCreateSchema>;

export const LeadResponseSchema = z
  .object({
    success: z.boolean(),
    leadId: z.string(),
    message: z.string().optional(),
  })
  .strict();

export type LeadResponse = z.infer<typeof LeadResponseSchema>;

export const LeadRecordSchema = z
  .object({
    id: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    countryCode: CountryCodeSchema,
    status: LeadStatusSchema.default('new'),
    listingId: z.string().optional(),
    propertyRef: z.string().optional(),
    propertyTitle: z.string().optional(),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    currency: CurrencyCodeSchema.optional(),
    message: z.string().optional(),
    preferredContact: z.enum(['whatsapp', 'phone', 'email']).default('whatsapp'),
    internalNotes: z.string().optional(),
    utmSource: z.string().optional(),
    utmCampaign: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type LeadRecord = z.infer<typeof LeadRecordSchema>;

export const SubmissionCreateSchema = z
  .object({
    sellerName: z.string().min(2).max(100),
    sellerEmail: z.string().email(),
    sellerPhone: z.string().min(7).max(25),
    countryCode: CountryCodeSchema,
    city: z.string().min(1),
    area: z.string().optional(),
    propertyType: PropertyTypeSchema,
    bedrooms: z.number().int().min(0),
    bathrooms: z.number().min(0),
    sizeSqm: z.number().positive(),
    expectedPriceMinor: z.number().int().positive(),
    currency: CurrencyCodeSchema,
    description: z.string().max(2000).optional(),
    notes: z.string().max(1000).optional(),
    images: z.array(z.string()).optional().default([]),
    consentGiven: z.literal(true, {
      message: 'You must agree to the terms and privacy policy to submit a property',
    }),
  })
  .strict();

export type SubmissionCreate = z.infer<typeof SubmissionCreateSchema>;

export const SubmissionRecordSchema = z
  .object({
    id: z.string(),
    sellerName: z.string(),
    sellerEmail: z.string().email(),
    sellerPhone: z.string(),
    countryCode: CountryCodeSchema,
    city: z.string(),
    area: z.string().optional(),
    propertyType: PropertyTypeSchema,
    bedrooms: z.number().int().min(0),
    bathrooms: z.number().min(0),
    sizeSqm: z.number().positive(),
    expectedPriceMinor: z.number().int().positive(),
    currency: CurrencyCodeSchema,
    description: z.string().optional(),
    notes: z.string().optional(),
    images: z.array(z.string()).default([]),
    status: SubmissionStatusSchema.default('pending_review'),
    consentGiven: z.boolean().default(true).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type SubmissionRecord = z.infer<typeof SubmissionRecordSchema>;

export const SubmissionResponseSchema = z
  .object({
    success: z.boolean(),
    submissionId: z.string(),
    message: z.string().optional(),
  })
  .strict();

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
