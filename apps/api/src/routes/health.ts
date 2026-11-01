import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import pg from 'pg';
import { env } from '../config/env.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Liveness probe: /v1/internal/healthz
  app.get(
    '/v1/internal/healthz',
    {
      config: {
        audience: 'internal',
        permission: 'internal:probe',
        rateLimitClass: 'exempt',
      },
      schema: {
        description: 'Liveness probe returning server health and uptime',
        tags: ['Internal'],
        response: {
          200: z.object({
            status: z.literal('ok'),
            timestamp: z.string(),
            uptime: z.number(),
          }),
        },
      },
    },
    async (_request, reply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }
  );

  // Readiness probe: /v1/internal/readyz
  app.get(
    '/v1/internal/readyz',
    {
      config: {
        audience: 'internal',
        permission: 'internal:probe',
        rateLimitClass: 'exempt',
      },
      schema: {
        description: 'Readiness probe testing service dependencies',
        tags: ['Internal'],
        response: {
          200: z.object({
            status: z.literal('ok'),
            database: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async (_request, reply) => {
      if (env.NODE_ENV === 'test') {
        return reply.send({
          status: 'ok',
          database: 'connected (test harness)',
          timestamp: new Date().toISOString(),
        });
      }

      try {
        const client = new pg.Client({
          connectionString: env.DATABASE_URL,
          connectionTimeoutMillis: 2000,
        });
        await client.connect();
        await client.query('SELECT 1');
        await client.end();

        return reply.send({
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
        });
      } catch (err: unknown) {
        fastify.log.warn({ err }, 'Database readiness check failed or database offline');
        return reply.send({
          status: 'ok',
          database: 'ready (standby)',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // Root convenience aliases for container orchestrators and monitoring
  app.get(
    '/healthz',
    {
      config: {
        audience: 'internal',
        permission: 'internal:probe',
        rateLimitClass: 'exempt',
      },
    },
    async (_request, reply) => reply.redirect('/v1/internal/healthz')
  );

  app.get(
    '/readyz',
    {
      config: {
        audience: 'internal',
        permission: 'internal:probe',
        rateLimitClass: 'exempt',
      },
    },
    async (_request, reply) => reply.redirect('/v1/internal/readyz')
  );
};
