import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CountryCodeSchema,
  SearchQuerySchema,
  ListingSummarySchema,
  ListingDetailSchema,
  SearchResultSchema,
  LocationSchema,
  DeveloperSchema,
  ProjectSchema,
  SmartSearchSuggestionGroupSchema,
  ProblemDetailsSchema,
  PropertyTypeSchema,
  PropertyStatusSchema,
  CurrencyCodeSchema,
  UnitSizeUnitSchema,
  ListingSortSchema,
} from '@wild-hills/contracts';
import { locationsService } from '../services/locations.service.js';
import { developersService } from '../services/developers.service.js';
import { projectsService } from '../services/projects.service.js';
import { listingsService } from '../services/listings.service.js';
import { ratesService } from '../services/rates.service.js';
import { searchService } from '../services/search.service.js';
import { contentService } from '../services/content.service.js';

// Strict input schemas for all routes (Rule 14 & Boundary Validation)
const CountryFilterQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
  })
  .strict();

const SlugParamSchema = z
  .object({
    slug: z.string().min(1),
  })
  .strict();

const BooleanStringSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return val;
}, z.boolean().optional());

const ListingSearchQuerySchema = z
  .object({
    q: z.string().optional(),
    country: CountryCodeSchema.optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    type: z.union([PropertyTypeSchema, z.array(PropertyTypeSchema)]).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    currency: CurrencyCodeSchema.optional(),
    beds: z.union([z.coerce.number().int().min(0), z.string(), z.array(z.coerce.number().int().min(0))]).optional(),
    baths: z.coerce.number().min(0).optional(),
    minSize: z.coerce.number().nonnegative().optional(),
    maxSize: z.coerce.number().nonnegative().optional(),
    sizeUnit: UnitSizeUnitSchema.optional().default('sqm'),
    status: z.union([PropertyStatusSchema, z.array(PropertyStatusSchema)]).optional(),
    handoverYear: z.coerce.number().int().optional(),
    features: z.union([z.string(), z.array(z.string())]).optional(),
    developer: z.string().optional(),
    project: z.string().optional(),
    isFeatured: BooleanStringSchema,
    isHotDeal: BooleanStringSchema,
    isNewLaunch: BooleanStringSchema,
    isVerified: BooleanStringSchema,
    hasInstallments: BooleanStringSchema,
    sort: ListingSortSchema.optional().default('featured'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  })
  .strict();

const ListingRefOrSlugParamSchema = z
  .object({
    ref_or_slug: z.string().min(1),
  })
  .strict();

const SuggestQuerySchema = z
  .object({
    q: z.string().optional(),
    query: z.string().optional(),
    country: CountryCodeSchema.optional(),
  })
  .strict();

const ContentCountryParamSchema = z
  .object({
    country: CountryCodeSchema,
  })
  .strict();

const ContentCountryCodeParamSchema = z
  .object({
    countryCode: CountryCodeSchema,
  })
  .strict();

export const publicRoutes: FastifyPluginAsync = async (fastify) => {
  // ---------------------------------------------------------------------------
  // 1. Locations
  // ---------------------------------------------------------------------------
  fastify.get(
    '/locations',
    {
      schema: {
        querystring: CountryFilterQuerySchema,
        response: {
          200: z.array(LocationSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof CountryFilterQuerySchema>;
      const locations = await locationsService.getLocations(country);

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['locations', country ? `locations-${country}` : 'locations-all'],
      });

      return locations;
    }
  );

  fastify.get(
    '/locations/:slug',
    {
      schema: {
        params: SlugParamSchema,
        response: {
          200: LocationSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as z.infer<typeof SlugParamSchema>;
      const location = await locationsService.getLocationBySlug(slug);

      if (!location) {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Location with slug "${slug}" not found`,
          instance: request.url,
        });
      }

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['locations', `location-${slug}`],
      });

      return location;
    }
  );

  // ---------------------------------------------------------------------------
  // 2. Developers
  // ---------------------------------------------------------------------------
  fastify.get(
    '/developers',
    {
      schema: {
        querystring: CountryFilterQuerySchema,
        response: {
          200: z.array(DeveloperSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof CountryFilterQuerySchema>;
      const developers = await developersService.getDevelopers(country);

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['developers', country ? `developers-${country}` : 'developers-all'],
      });

      return developers;
    }
  );

  fastify.get(
    '/developers/:slug',
    {
      schema: {
        params: SlugParamSchema,
        response: {
          200: DeveloperSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as z.infer<typeof SlugParamSchema>;
      const developer = await developersService.getDeveloper(slug);

      if (!developer) {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Developer with slug/id "${slug}" not found`,
          instance: request.url,
        });
      }

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['developers', `developer-${slug}`],
      });

      return developer;
    }
  );

  // ---------------------------------------------------------------------------
  // 3. Projects
  // ---------------------------------------------------------------------------
  fastify.get(
    '/projects',
    {
      schema: {
        querystring: CountryFilterQuerySchema,
        response: {
          200: z.array(ProjectSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof CountryFilterQuerySchema>;
      const projects = await projectsService.getProjects(country);

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['projects', country ? `projects-${country}` : 'projects-all'],
      });

      return projects;
    }
  );

  fastify.get(
    '/projects/:slug',
    {
      schema: {
        params: SlugParamSchema,
        response: {
          200: ProjectSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as z.infer<typeof SlugParamSchema>;
      const project = await projectsService.getProjectBySlug(slug);

      if (!project) {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Project with slug "${slug}" not found`,
          instance: request.url,
        });
      }

      reply.setCacheHeaders({
        maxAge: 300,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        tags: ['projects', `project-${slug}`],
      });

      return project;
    }
  );

  // ---------------------------------------------------------------------------
  // 4. Listings Search
  // ---------------------------------------------------------------------------
  fastify.get(
    '/listings',
    {
      schema: {
        querystring: ListingSearchQuerySchema,
        response: {
          200: SearchResultSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as z.infer<typeof ListingSearchQuerySchema>;
      const result = await listingsService.searchListings(query);

      const tags = ['listings'];
      if (query.country) tags.push(`listings-${query.country}`);

      reply.setCacheHeaders({
        maxAge: 60,
        sMaxAge: 300,
        staleWhileRevalidate: 86400,
        tags,
      });

      return result;
    }
  );

  // ---------------------------------------------------------------------------
  // 5. Listing Detail (supporting both /listings/:ref_or_slug and /listings/:slug)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/listings/:ref_or_slug',
    {
      schema: {
        params: ListingRefOrSlugParamSchema,
        response: {
          200: ListingDetailSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { ref_or_slug } = request.params as z.infer<typeof ListingRefOrSlugParamSchema>;
      const listing = await listingsService.getListingDetail(ref_or_slug);

      if (!listing) {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Listing with reference or slug "${ref_or_slug}" not found`,
          instance: request.url,
        });
      }

      reply.setCacheHeaders({
        maxAge: 120,
        sMaxAge: 600,
        staleWhileRevalidate: 86400,
        tags: ['listings', `listing-${listing.id}`, `listing-${listing.refNumber}`],
      });

      return listing;
    }
  );

  // ---------------------------------------------------------------------------
  // 6. Exchange Rates
  // ---------------------------------------------------------------------------
  fastify.get('/rates', async (_request, reply) => {
    const rates = await ratesService.getExchangeRates();

    reply.setCacheHeaders({
      maxAge: 1800,
      sMaxAge: 3600,
      staleWhileRevalidate: 86400,
      tags: ['rates'],
    });

    return rates;
  });

  // ---------------------------------------------------------------------------
  // 7. Search Suggestions & Auto-Complete (Section 9.2 & Typo-Tolerant Engine)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/suggest',
    {
      schema: {
        querystring: SuggestQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query as z.infer<typeof SuggestQuerySchema>;
      const q = query.q || query.query || '';
      const suggestions = await searchService.getPublicSuggestions(q, query.country);

      reply.setCacheHeaders({
        maxAge: 60,
        sMaxAge: 300,
        staleWhileRevalidate: 86400,
        tags: ['search', 'suggestions'],
      });

      return suggestions;
    }
  );
};
