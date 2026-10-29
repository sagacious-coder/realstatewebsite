import { z } from 'zod';
import { CountryCodeSchema, CurrencyCodeSchema, PropertyStatusSchema } from './enums.js';

export const DeveloperSchema = z
  .object({
    id: z.string(),
    slug: z.string().min(1),
    name: z.string().min(1),
    logo: z.string(),
    countryCodes: z.array(CountryCodeSchema).min(1),
    websiteUrl: z.string().url().nullable().optional(),
    description: z.string().default(''),
    projectCount: z.number().int().nonnegative().default(0),
    activeListingCount: z.number().int().nonnegative().default(0),
    isFeatured: z.boolean().default(false),
  })
  .strict();

export type Developer = z.infer<typeof DeveloperSchema>;

export const ProjectSchema = z
  .object({
    id: z.string(),
    slug: z.string().min(1),
    name: z.string().min(1),
    developerId: z.string(),
    developerName: z.string().min(1),
    locationId: z.string(),
    locationName: z.string().min(1),
    countryCode: CountryCodeSchema,
    description: z.string().default(''),
    heroImage: z.string(),
    images: z.array(z.string()).default([]),
    status: PropertyStatusSchema,
    handoverYear: z.number().int().nullable().optional(),
    startingPriceMinor: z.number().nonnegative(),
    currency: CurrencyCodeSchema,
    paymentPlanSummary: z.string().nullable().optional(),
  })
  .strict();

export type Project = z.infer<typeof ProjectSchema>;

