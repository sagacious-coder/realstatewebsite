import { z } from 'zod';
import {
  CountryCodeSchema,
  CurrencyCodeSchema,
  PropertyStatusSchema,
  PropertyTypeSchema,
  FurnishingStatusSchema,
} from './enums.js';
import { CoordinatesSchema } from './locations.js';

export const ListingLocationBriefSchema = z
  .object({
    id: z.string(),
    countryCode: CountryCodeSchema,
    city: z.string().min(1),
    area: z.string().nullable().optional(),
  })
  .strict();

export type ListingLocationBrief = z.infer<typeof ListingLocationBriefSchema>;

export const EntityBriefSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().optional(),
  })
  .strict();

export type EntityBrief = z.infer<typeof EntityBriefSchema>;

export const ListingSummarySchema = z
  .object({
    id: z.string(),
    refNumber: z.string().min(1).describe('Formatted reference, e.g. WH-AE-101'),
    slug: z.string().min(1),
    title: z.string().min(1),
    propertyType: PropertyTypeSchema,
    status: PropertyStatusSchema,
    location: ListingLocationBriefSchema,
    developer: EntityBriefSchema.nullable().optional(),
    project: EntityBriefSchema.nullable().optional(),
    priceMinor: z.number().int().nonnegative().describe('Price in original minor currency units'),
    currency: CurrencyCodeSchema,
    priceUsdMinor: z.number().int().nonnegative().describe('Normalized USD price for sorting/filters'),
    bedrooms: z.number().int().min(0).describe('0 for studio'),
    bathrooms: z.number().min(0),
    sizeSqm: z.number().nonnegative(),
    sizeSqft: z.number().nonnegative(),
    coverImage: z.string(),
    isHotDeal: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    isNewLaunch: z.boolean().default(false),
    isSample: z.boolean().default(true).describe('Flag indicating sample / demo property data'),
    completionYear: z.number().int().nullable().optional(),
    furnishingStatus: FurnishingStatusSchema.optional(),
    badges: z.array(z.string()).default([]),
  })
  .strict();

export type ListingSummary = z.infer<typeof ListingSummarySchema>;

export const ListingImageSchema = z
  .object({
    url: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    order: z.number().int().default(0),
  })
  .strict();

export type ListingImage = z.infer<typeof ListingImageSchema>;

export const FloorPlanSchema = z
  .object({
    url: z.string(),
    title: z.string().min(1),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().optional(),
    sizeSqm: z.number().optional(),
  })
  .strict();

export type FloorPlan = z.infer<typeof FloorPlanSchema>;

export const MilestonePaymentSchema = z
  .object({
    milestone: z.string(),
    percent: z.number().min(0).max(100),
  })
  .strict();

export type MilestonePayment = z.infer<typeof MilestonePaymentSchema>;

export const PaymentPlanSchema = z
  .object({
    downPaymentPercent: z.number().min(0).max(100),
    installmentsCount: z.number().int().optional(),
    installmentDurationMonths: z.number().int().optional(),
    postHandover: z.boolean().default(false),
    milestoneBreakdown: z.array(MilestonePaymentSchema).optional(),
  })
  .strict();

export type PaymentPlan = z.infer<typeof PaymentPlanSchema>;

export const AgentBriefSchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    whatsapp: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string(),
    license: z.string().optional(),
  })
  .strict();

export type AgentBrief = z.infer<typeof AgentBriefSchema>;

export const ListingDetailSchema = ListingSummarySchema.extend({
  description: z.string(),
  images: z.array(ListingImageSchema).default([]),
  floorPlans: z.array(FloorPlanSchema).default([]),
  features: z.array(z.string()).default([]),
  videoUrl: z.string().nullable().optional(),
  virtualTourUrl: z.string().nullable().optional(),
  agent: AgentBriefSchema,
  paymentPlan: PaymentPlanSchema.nullable().optional(),
  coordinates: CoordinatesSchema.nullable().optional(),
  publishedAt: z.string().describe('ISO timestamp'),
  updatedAt: z.string().describe('ISO timestamp'),
}).strict();

export type ListingDetail = z.infer<typeof ListingDetailSchema>;

export function toListingSummary(detail: ListingDetail): ListingSummary {
  return {
    id: detail.id,
    refNumber: detail.refNumber,
    slug: detail.slug,
    title: detail.title,
    propertyType: detail.propertyType,
    status: detail.status,
    location: detail.location,
    developer: detail.developer,
    project: detail.project,
    priceMinor: detail.priceMinor,
    currency: detail.currency,
    priceUsdMinor: detail.priceUsdMinor,
    bedrooms: detail.bedrooms,
    bathrooms: detail.bathrooms,
    sizeSqm: detail.sizeSqm,
    sizeSqft: detail.sizeSqft,
    coverImage: detail.coverImage,
    isHotDeal: detail.isHotDeal,
    isFeatured: detail.isFeatured,
    isVerified: detail.isVerified,
    isNewLaunch: detail.isNewLaunch,
    isSample: detail.isSample,
    completionYear: detail.completionYear,
    furnishingStatus: detail.furnishingStatus,
    badges: detail.badges,
  };
}

