import { z } from 'zod';
import { CountryCodeSchema, CurrencyCodeSchema, LocaleSchema } from './enums.js';

export const SmartSearchSuggestionGroupSchema = z
  .object({
    query: z.string(),
    cities: z
      .array(
        z
          .object({
            name: z.string(),
            slug: z.string(),
            countryCode: CountryCodeSchema,
            count: z.number().int().nonnegative(),
          })
          .strict()
      )
      .default([]),
    areas: z
      .array(
        z
          .object({
            name: z.string(),
            slug: z.string(),
            city: z.string(),
            countryCode: CountryCodeSchema,
            count: z.number().int().nonnegative(),
          })
          .strict()
      )
      .default([]),
    projects: z
      .array(
        z
          .object({
            name: z.string(),
            slug: z.string(),
            developerName: z.string(),
            countryCode: CountryCodeSchema,
            count: z.number().int().nonnegative(),
          })
          .strict()
      )
      .default([]),
    developers: z
      .array(
        z
          .object({
            name: z.string(),
            slug: z.string(),
            countryCode: CountryCodeSchema,
            count: z.number().int().nonnegative(),
          })
          .strict()
      )
      .default([]),
    references: z
      .array(
        z
          .object({
            refNumber: z.string(),
            slug: z.string(),
            title: z.string(),
          })
          .strict()
      )
      .default([]),
  })
  .strict();

export type SmartSearchSuggestionGroup = z.infer<typeof SmartSearchSuggestionGroupSchema>;

export const GuideSectionSchema = z
  .object({
    heading: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();

export type GuideSection = z.infer<typeof GuideSectionSchema>;

export const BuyingGuideSchema = z
  .object({
    id: z.string(),
    slug: z.string().min(1),
    countryCode: CountryCodeSchema,
    title: z.string().min(1),
    summary: z.string(),
    contentSections: z.array(GuideSectionSchema).min(1),
    updatedDate: z.string(),
    isSample: z.boolean().default(true),
  })
  .strict();

export type BuyingGuide = z.infer<typeof BuyingGuideSchema>;

export const FaqItemSchema = z
  .object({
    id: z.string(),
    question: z.string().min(1),
    answer: z.string().min(1),
    category: z.string().min(1),
    countryCode: CountryCodeSchema.nullable().optional(),
  })
  .strict();

export type FaqItem = z.infer<typeof FaqItemSchema>;

export const TestimonialSchema = z
  .object({
    id: z.string(),
    author: z.string().min(1),
    location: z.string().min(1),
    quote: z.string().min(1),
    rating: z.number().min(1).max(5).default(5),
    countryCode: CountryCodeSchema,
    date: z.string(),
    avatarUrl: z.string().nullable().optional(),
  })
  .strict();

export type Testimonial = z.infer<typeof TestimonialSchema>;

export const BlogAuthorSchema = z
  .object({
    name: z.string().min(1),
    role: z.string(),
    avatarUrl: z.string().nullable().optional(),
  })
  .strict();

export type BlogAuthor = z.infer<typeof BlogAuthorSchema>;

export const BlogPostSchema = z
  .object({
    id: z.string(),
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string(),
    content: z.string(),
    coverImage: z.string(),
    author: BlogAuthorSchema,
    publishedAt: z.string(),
    readingTimeMinutes: z.number().int().min(1),
    countryCode: CountryCodeSchema.nullable().optional(),
    tags: z.array(z.string()).default([]),
  })
  .strict();

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const CountrySettingsSchema = z
  .object({
    countryCode: CountryCodeSchema,
    currency: CurrencyCodeSchema,
    defaultLocale: LocaleSchema,
    phonePrefix: z.string(),
    supportPhone: z.string(),
    supportWhatsapp: z.string(),
    supportEmail: z.string().email(),
    officeAddress: z.string(),
    legalDisclaimer: z.string(),
    isSample: z.boolean().default(true),
  })
  .strict();

export type CountrySettings = z.infer<typeof CountrySettingsSchema>;

export const ExchangeRatesSchema = z
  .object({
    base: CurrencyCodeSchema.default('USD'),
    timestamp: z.string(),
    rates: z.record(CurrencyCodeSchema, z.number().positive()),
  })
  .strict();

export type ExchangeRates = z.infer<typeof ExchangeRatesSchema>;

