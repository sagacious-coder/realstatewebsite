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
import { healthRoutes } from './routes/health.js';

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
  await app.register(swaggerPlugin);

  // Register route modules
  await app.register(healthRoutes);

  return app;
}
