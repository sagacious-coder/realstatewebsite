import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { runSeed } from './db/seed.js';
import * as schema from './db/schema/index.js';

async function main() {
  const app = await buildApp();

  if (process.env.AUTO_MIGRATE === 'true') {
    const client = new pg.Client({ connectionString: env.DATABASE_URL });
    try {
      await client.connect();
      app.log.info('Applying database migrations on startup...');
      await runMigrations(client);
      if (process.env.AUTO_SEED === 'true') {
        app.log.info('Applying idempotent database seed on startup...');
        const dbInstance = drizzle(client, { schema });
        await runSeed(dbInstance);
      }
    } finally {
      await client.end();
    }
  }

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

