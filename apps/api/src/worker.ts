import { PgBoss } from 'pg-boss';
import pino from 'pino';
import { env } from './config/env.js';
import { REDACTED_PATHS } from './plugins/logging.js';
import { queueService } from './services/queue.service.js';
import { workerService } from './services/worker.service.js';

const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
});

// Register handler functions into queueService
queueService.registerHandler('lead.intake', async (data) => {
  await workerService.handleLeadIntake(data);
});

queueService.registerHandler('submission.intake', async (data) => {
  await workerService.handleSubmissionIntake(data);
});

queueService.registerHandler('media.process', async (data) => {
  await workerService.handleMediaProcess(data);
});

queueService.registerHandler('fx.refresh', async () => {
  await workerService.handleFxRefresh();
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
    queueService.setPgBoss(boss);
    logger.info('✅ pg-boss background worker connected and listening for jobs');

    // Register job queues with retry backoff and concurrency
    await boss.createQueue('lead.intake', { retryLimit: 3, retryDelay: 5 });
    await boss.createQueue('submission.intake', { retryLimit: 3, retryDelay: 5 });
    await boss.createQueue('media.process', { retryLimit: 3, retryDelay: 5 });
    await boss.createQueue('fx.refresh', { retryLimit: 2, retryDelay: 10 });
    await boss.createQueue('storage.cleanup', { retryLimit: 1 });

    // Attach worker listeners
    await boss.work('lead.intake', { batchSize: 5 }, async (jobs) => {
      for (const job of jobs) {
        try {
          await workerService.handleLeadIntake(job.data as any);
        } catch (err) {
          logger.error({ err, jobId: job.id }, 'Error processing lead.intake job');
          throw err;
        }
      }
    });

    await boss.work('submission.intake', { batchSize: 5 }, async (jobs) => {
      for (const job of jobs) {
        try {
          await workerService.handleSubmissionIntake(job.data as any);
        } catch (err) {
          logger.error({ err, jobId: job.id }, 'Error processing submission.intake job');
          throw err;
        }
      }
    });

    await boss.work('media.process', { batchSize: 2 }, async (jobs) => {
      for (const job of jobs) {
        try {
          await workerService.handleMediaProcess(job.data as any);
        } catch (err) {
          logger.error({ err, jobId: job.id }, 'Error processing media.process job');
          throw err;
        }
      }
    });

    await boss.work('fx.refresh', async () => {
      await workerService.handleFxRefresh();
    });

    logger.info('Worker queues active: lead.intake, submission.intake, media.process, fx.refresh');
  } catch (err) {
    logger.warn({ err }, 'Failed to start pg-boss (PostgreSQL may be offline during initial bootstrap)');
  }

  return boss;
}

if (process.env.NODE_ENV !== 'test') {
  void startWorker();
}
