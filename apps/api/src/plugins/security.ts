import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

export const securityPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Helmet security headers (enforced CSP, nosniff, DENY frameguard, HSTS)
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  });

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        return cb(null, true);
      }
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return cb(null, true);
      }
      return cb(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept'],
  });

  // Global rate limiter baseline
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', '::1'],
    errorResponseBuilder: (_req, context) => ({
      type: 'https://datatracker.ietf.org/doc/html/rfc9457#section-3.1',
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Max ${context.max} requests per ${context.after}`,
    }),
  });
});

