import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CountryCodeSchema,
  SmartSearchSuggestionGroupSchema,
  CountrySettingsSchema,
  BuyingGuideSchema,
  FaqItemSchema,
  TestimonialSchema,
  BlogPostSchema,
  ProblemDetailsSchema,
} from '@wild-hills/contracts';
import { searchService } from '../services/search.service.js';
import { ratesService } from '../services/rates.service.js';
import { contentService } from '../services/content.service.js';

const SmartSuggestQuerySchema = z
  .object({
    q: z.string().optional(),
    country: CountryCodeSchema.optional(),
  })
  .strict();

const CountryParamSchema = z
  .object({
    country: CountryCodeSchema,
  })
  .strict();

const OptionalCountryQuerySchema = z
  .object({
    country: CountryCodeSchema.optional(),
  })
  .strict();

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // ---------------------------------------------------------------------------
  // Search Suggestions (SmartSearchSuggestionGroup contract)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/search/suggestions',
    {
      schema: {
        querystring: SmartSuggestQuerySchema,
        response: {
          200: SmartSearchSuggestionGroupSchema,
        },
      },
    },
    async (request, reply) => {
      const { q, country } = request.query as z.infer<typeof SmartSuggestQuerySchema>;
      const suggestions = await searchService.getSmartSuggestions(q || '', country);

      reply.setCacheHeaders({
        maxAge: 60,
        sMaxAge: 300,
        staleWhileRevalidate: 86400,
        tags: ['search', 'suggestions'],
      });

      return suggestions;
    }
  );

  // ---------------------------------------------------------------------------
  // Exchange Rates alias (/v1/content/rates)
  // ---------------------------------------------------------------------------
  fastify.get('/content/rates', async (_request, reply) => {
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
  // Country Settings (/v1/content/country-settings/:country)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/content/country-settings/:country',
    {
      schema: {
        params: CountryParamSchema,
        response: {
          200: CountrySettingsSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { country } = request.params as z.infer<typeof CountryParamSchema>;
      try {
        const settings = await contentService.getCountrySettings(country);
        reply.setCacheHeaders({
          maxAge: 3600,
          sMaxAge: 86400,
          staleWhileRevalidate: 604800,
          tags: ['content', `country-${country}`],
        });
        return settings;
      } catch {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Settings for country "${country}" not found`,
          instance: request.url,
        });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // Buying Guide (/v1/content/buying-guide/:country)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/content/buying-guide/:country',
    {
      schema: {
        params: CountryParamSchema,
        response: {
          200: BuyingGuideSchema,
          404: ProblemDetailsSchema,
        },
      },
    },
    async (request, reply) => {
      const { country } = request.params as z.infer<typeof CountryParamSchema>;
      const guide = await contentService.getBuyingGuide(country);

      if (!guide) {
        return reply.status(404).type('application/problem+json').send({
          type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
          title: 'Not Found',
          status: 404,
          detail: `Buying guide for country "${country}" not found`,
          instance: request.url,
        });
      }

      reply.setCacheHeaders({
        maxAge: 3600,
        sMaxAge: 86400,
        staleWhileRevalidate: 604800,
        tags: ['content', `buying-guide-${country}`],
      });

      return guide;
    }
  );

  // ---------------------------------------------------------------------------
  // FAQs (/v1/content/faqs)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/content/faqs',
    {
      schema: {
        querystring: OptionalCountryQuerySchema,
        response: {
          200: z.array(FaqItemSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof OptionalCountryQuerySchema>;
      const faqs = await contentService.getFaqs(country);

      reply.setCacheHeaders({
        maxAge: 3600,
        sMaxAge: 86400,
        staleWhileRevalidate: 604800,
        tags: ['content', 'faqs'],
      });

      return faqs;
    }
  );

  // ---------------------------------------------------------------------------
  // Testimonials (/v1/content/testimonials)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/content/testimonials',
    {
      schema: {
        querystring: OptionalCountryQuerySchema,
        response: {
          200: z.array(TestimonialSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof OptionalCountryQuerySchema>;
      const testimonials = await contentService.getTestimonials(country);

      reply.setCacheHeaders({
        maxAge: 3600,
        sMaxAge: 86400,
        staleWhileRevalidate: 604800,
        tags: ['content', 'testimonials'],
      });

      return testimonials;
    }
  );

  // ---------------------------------------------------------------------------
  // Blog Posts (/v1/content/blog-posts)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/content/blog-posts',
    {
      schema: {
        querystring: OptionalCountryQuerySchema,
        response: {
          200: z.array(BlogPostSchema),
        },
      },
    },
    async (request, reply) => {
      const { country } = request.query as z.infer<typeof OptionalCountryQuerySchema>;
      const posts = await contentService.getBlogPosts(country);

      reply.setCacheHeaders({
        maxAge: 3600,
        sMaxAge: 86400,
        staleWhileRevalidate: 604800,
        tags: ['content', 'blog-posts'],
      });

      return posts;
    }
  );
};
