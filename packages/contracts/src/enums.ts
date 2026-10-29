import { z } from 'zod';

export const COUNTRY_CODES = ['ae', 'tr', 'ge', 'eg'] as const;
export const CountryCodeSchema = z.enum(COUNTRY_CODES);
export type CountryCode = z.infer<typeof CountryCodeSchema>;

export const LOCALES = ['en', 'ar', 'tr', 'ka'] as const;
export const LocaleSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof LocaleSchema>;

export const CURRENCY_CODES = ['AED', 'TRY', 'GEL', 'EGP', 'USD', 'EUR', 'GBP'] as const;
export const CurrencyCodeSchema = z.enum(CURRENCY_CODES);
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const LOCATION_TYPES = ['country', 'region', 'city', 'area'] as const;
export const LocationTypeSchema = z.enum(LOCATION_TYPES);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'townhouse',
  'penthouse',
  'duplex',
  'studio',
  'chalet',
  'land',
  'commercial',
] as const;
export const PropertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const PROPERTY_STATUSES = ['ready', 'under_construction', 'off_plan'] as const;
export const PropertyStatusSchema = z.enum(PROPERTY_STATUSES);
export type PropertyStatus = z.infer<typeof PropertyStatusSchema>;

export const FURNISHING_STATUSES = ['furnished', 'semi_furnished', 'unfurnished'] as const;
export const FurnishingStatusSchema = z.enum(FURNISHING_STATUSES);
export type FurnishingStatus = z.infer<typeof FurnishingStatusSchema>;

export const UNIT_SIZE_UNITS = ['sqm', 'sqft'] as const;
export const UnitSizeUnitSchema = z.enum(UNIT_SIZE_UNITS);
export type UnitSizeUnit = z.infer<typeof UnitSizeUnitSchema>;

export const LISTING_SORTS = [
  'featured',
  'price_asc',
  'price_desc',
  'newest',
  'beds_asc',
  'beds_desc',
  'size_desc',
] as const;
export const ListingSortSchema = z.enum(LISTING_SORTS);
export type ListingSort = z.infer<typeof ListingSortSchema>;

export const LEAD_TYPES = [
  'inquiry',
  'viewing',
  'brochure',
  'contact',
  'country_no_listings',
] as const;
export const LeadTypeSchema = z.enum(LEAD_TYPES);
export type LeadType = z.infer<typeof LeadTypeSchema>;

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost', 'closed'] as const;
export const LeadStatusSchema = z.enum(LEAD_STATUSES);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const SUBMISSION_STATUSES = ['pending', 'reviewing', 'approved', 'rejected'] as const;
export const SubmissionStatusSchema = z.enum(SUBMISSION_STATUSES);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const REVIEW_STATUSES = ['draft', 'pending', 'published', 'archived'] as const;
export const ReviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const PERMISSIONS = {
  READ_PUBLIC: 'read:public',
  CREATE_LEAD: 'create:lead',
  CREATE_SUBMISSION: 'create:submission',
  ADMIN_READ_LISTINGS: 'admin:read:listings',
  ADMIN_WRITE_LISTINGS: 'admin:write:listings',
  ADMIN_READ_LEADS: 'admin:read:leads',
  ADMIN_WRITE_LEADS: 'admin:write:leads',
  ADMIN_READ_USERS: 'admin:read:users',
  ADMIN_WRITE_USERS: 'admin:write:users',
  ADMIN_MANAGE_LOCATIONS: 'admin:manage:locations',
  ADMIN_MANAGE_SETTINGS: 'admin:manage:settings',
  ADMIN_VIEW_AUDIT: 'admin:view:audit',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

