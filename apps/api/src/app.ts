import fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { REDACTED_PATHS, loggingPlugin } from './plugins/logging.js';
import { errorsPlugin } from './plugins/errors.js';
import { securityPlugin } from './plugins/security.js';
import { registryPlugin } from './plugins/registry.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { authPlugin } from './plugins/auth.js';
import { cachingPlugin } from './plugins/caching.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { contentRoutes } from './routes/content.js';
import { leadsRoutes } from './routes/leads.js';
import { adminRoutes } from './routes/admin.js';

export async function buildApp(customLogger?: any): Promise<FastifyInstance<any, any, any, any, any>> {
  const defaultLoggerConfig = {
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    redact: {
      paths: REDACTED_PATHS,
      censor: '[REDACTED]',
    },
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          headers: req.headers,
          remoteAddress: req.ip,
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
          headers: typeof res.getHeaders === 'function' ? res.getHeaders() : res.headers,
        };
      },
    },
  };

  const fastifyOpts: any = {
    bodyLimit: 1048576, // 1MB standard body limit
    ajv: {
      customOptions: {
        coerceTypes: true,
      },
    },
  };

  if (customLogger && typeof customLogger.info === 'function') {
    fastifyOpts.loggerInstance = customLogger;
  } else {
    fastifyOpts.logger = customLogger ?? defaultLoggerConfig;
  }

  const app = fastify(fastifyOpts).withTypeProvider<ZodTypeProvider>();

  // Set Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register core plugins in order
  await app.register(loggingPlugin);
  await app.register(errorsPlugin);
  await app.register(securityPlugin);
  await app.register(registryPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);
  await app.register(cachingPlugin);

  // Register route modules
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(publicRoutes, { prefix: '/v1/public' });
  await app.register(publicRoutes, { prefix: '/v1' });
  await app.register(contentRoutes, { prefix: '/v1' });
  await app.register(leadsRoutes, { prefix: '/v1/public' });
  await app.register(leadsRoutes, { prefix: '/v1' });
  await app.register(adminRoutes, { prefix: '/v1/admin' });

  return app;
}
