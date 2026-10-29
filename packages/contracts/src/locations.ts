import { z } from 'zod';
import { CountryCodeSchema, LocaleSchema, CurrencyCodeSchema, LocationTypeSchema } from './enums.js';

export const CoordinatesSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();

export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const CountrySchema = z
  .object({
    code: CountryCodeSchema,
    name: z.string().min(1),
    currency: CurrencyCodeSchema,
    defaultLocale: LocaleSchema,
    phonePrefix: z.string(),
    isSupported: z.boolean(),
  })
  .strict();

export type Country = z.infer<typeof CountrySchema>;

export const LocationSchema = z
  .object({
    id: z.string(),
    slug: z.string().min(1),
    name: z.string().min(1),
    type: LocationTypeSchema,
    countryCode: CountryCodeSchema,
    parentId: z.string().nullable().optional(),
    isFeatured: z.boolean().default(false),
    pinOrder: z.number().int().nullable().optional(),
    coordinates: CoordinatesSchema.nullable().optional(),
    listingCount: z.number().int().nonnegative().default(0),
    coverImage: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    tagLabel: z.string().nullable().optional(),
  })
  .strict();

export type Location = z.infer<typeof LocationSchema>;

