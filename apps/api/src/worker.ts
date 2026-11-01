import { PgBoss } from 'pg-boss';
import pino from 'pino';
import { env } from './config/env.js';
import { REDACTED_PATHS } from './plugins/logging.js';

const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
});

export async function startWorker() {
  logger.info('Initializing Wild Hills background worker (pg-boss)...');

  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: 'pgboss',
    max: 5, // lightweight connection limit for lean single-server host
  });

  boss.on('error', (err) => {
    logger.error({ err }, 'pg-boss error occurred');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Stopping worker gracefully...');
    try {
      await boss.stop({ graceful: true, timeout: 10000 });
      logger.info('pg-boss stopped cleanly');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during worker shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await boss.start();
    logger.info('✅ pg-boss background worker connected and listening for jobs');

    // Register baseline job queues
    await boss.createQueue('email:send');
    await boss.createQueue('fx:sync');
    await boss.createQueue('storage:cleanup');

    logger.info('Queues initialized: email:send, fx:sync, storage:cleanup');
  } catch (err) {
    logger.warn({ err }, 'Failed to start pg-boss (PostgreSQL may be offline during initial bootstrap)');
  }

  return boss;
}

if (process.env.NODE_ENV !== 'test') {
  void startWorker();
}
