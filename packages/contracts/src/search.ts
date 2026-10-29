import { z } from 'zod';
import {
  CountryCodeSchema,
  CurrencyCodeSchema,
  ListingSortSchema,
  PropertyStatusSchema,
  PropertyTypeSchema,
  UnitSizeUnitSchema,
} from './enums.js';
import { ListingSummarySchema } from './listings.js';

export const SearchQuerySchema = z
  .object({
    q: z.string().optional().describe('Full-text search query across city, area, project, developer'),
    country: CountryCodeSchema.optional().describe('Country code filter'),
    city: z.string().optional().describe('City name or slug filter'),
    area: z.string().optional().describe('District or area name or slug filter'),
    type: z.union([PropertyTypeSchema, z.array(PropertyTypeSchema)]).optional(),
    minPrice: z.number().nonnegative().optional().describe('Minimum price in query currency'),
    maxPrice: z.number().nonnegative().optional().describe('Maximum price in query currency'),
    currency: CurrencyCodeSchema.optional().describe('Currency for price filters and results'),
    beds: z.union([z.number().int().min(0), z.string(), z.array(z.number().int().min(0))]).optional(),
    baths: z.number().min(0).optional(),
    minSize: z.number().nonnegative().optional(),
    maxSize: z.number().nonnegative().optional(),
    sizeUnit: UnitSizeUnitSchema.optional().default('sqm'),
    status: z.union([PropertyStatusSchema, z.array(PropertyStatusSchema)]).optional(),
    handoverYear: z.number().int().optional(),
    features: z.union([z.string(), z.array(z.string())]).optional(),
    developer: z.string().optional(),
    project: z.string().optional(),
    isFeatured: z.boolean().optional().describe('Filter by featured properties'),
    isHotDeal: z.boolean().optional(),
    isNewLaunch: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    hasInstallments: z.boolean().optional(),
    sort: ListingSortSchema.optional().default('featured'),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(50).optional().default(12),
  })
  .strict();

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchQueryInput = z.input<typeof SearchQuerySchema>;

export const FacetCountsSchema = z
  .object({
    byType: z.record(z.string(), z.number().int().nonnegative()).default({}),
    byCity: z.record(z.string(), z.number().int().nonnegative()).default({}),
    byStatus: z.record(z.string(), z.number().int().nonnegative()).default({}),
    priceRange: z
      .object({
        minUsdMinor: z.number().nonnegative(),
        maxUsdMinor: z.number().nonnegative(),
      })
      .optional(),
  })
  .strict();

export type FacetCounts = z.infer<typeof FacetCountsSchema>;

export const SearchResultSchema = z
  .object({
    items: z.array(ListingSummarySchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean(),
    facetCounts: FacetCountsSchema.optional(),
  })
  .strict();

export type SearchResult = z.infer<typeof SearchResultSchema>;

