import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '../config/env.js';

export const swaggerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Only expose interactive OpenAPI /docs in non-production environments
  if (env.NODE_ENV === 'production') {
    return;
  }

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Wild Hills Real Estate API',
        description: 'Fastify backend API and pg-boss worker service for Wild Hills luxury real estate',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: `${env.NODE_ENV} server`,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });
});

