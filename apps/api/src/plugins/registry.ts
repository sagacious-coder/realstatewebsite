import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export type RouteAudience = 'public' | 'admin' | 'internal';
export type RateLimitClass = 'standard' | 'auth' | 'upload' | 'exempt';

declare module 'fastify' {
  interface FastifyContextConfig {
    audience?: RouteAudience;
    permission?: string;
    rateLimitClass?: RateLimitClass;
  }
}

export const registryPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.addHook('onRoute', (routeOptions) => {
    // Allow Swagger and documentation routes to pass through with exempt classification
    if (routeOptions.url.startsWith('/docs') || routeOptions.url.startsWith('/static')) {
      routeOptions.config = {
        audience: 'internal',
        permission: 'public:read',
        rateLimitClass: 'exempt',
        ...routeOptions.config,
      };
      return;
    }

    const config = routeOptions.config || {};

    // Validate and assign default audience if not explicitly provided
    if (!config.audience) {
      if (routeOptions.url.startsWith('/v1/internal')) {
        config.audience = 'internal';
      } else if (routeOptions.url.startsWith('/v1/admin')) {
        config.audience = 'admin';
      } else {
        config.audience = 'public';
      }
    }

    // Validate and assign default permission if not explicitly provided
    if (!config.permission) {
      if (config.audience === 'public') {
        config.permission = 'public:read';
      } else if (config.audience === 'internal') {
        config.permission = 'internal:probe';
      } else {
        config.permission = 'admin:access';
      }
    }

    // Validate and assign rate limit class
    if (!config.rateLimitClass) {
      config.rateLimitClass = config.audience === 'internal' ? 'exempt' : 'standard';
    }

    routeOptions.config = config;
  });
});
