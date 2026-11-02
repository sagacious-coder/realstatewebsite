import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Graceful shutdown initiated');
    try {
      await app.close();
      app.log.info('Fastify server closed successfully');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ reason }, 'Unhandled rejection encountered');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    app.log.fatal({ err }, 'Uncaught exception encountered');
    process.exit(1);
  });

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    app.log.info(`🚀 Wild Hills API listening at ${address}`);
    if (env.NODE_ENV !== 'production') {
      app.log.info(`📖 OpenAPI documentation available at http://${env.HOST}:${env.PORT}/docs`);
    }
  } catch (err) {
    app.log.fatal({ err }, 'Failed to start API server');
    process.exit(1);
  }
}

void main();

