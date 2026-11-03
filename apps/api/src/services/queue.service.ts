import pino from 'pino';
import { env } from '../config/env.js';
import { REDACTED_PATHS } from '../plugins/logging.js';

const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
});

export type JobName =
  | 'lead.intake'
  | 'submission.intake'
  | 'media.process'
  | 'fx.refresh'
  | 'storage.cleanup';

export interface JobHandler<T = any> {
  (data: T): Promise<void>;
}

export class QueueService {
  private pgBossInstance: any = null;
  private inMemoryQueue: Array<{ name: JobName; data: any; id: string; timestamp: Date }> = [];
  private handlers = new Map<JobName, JobHandler[]>();

  public setPgBoss(boss: any): void {
    this.pgBossInstance = boss;
  }

  /**
   * Registers a job handler.
   */
  public registerHandler<T = any>(name: JobName, handler: JobHandler<T>): void {
    const existing = this.handlers.get(name) || [];
    existing.push(handler);
    this.handlers.set(name, existing);
  }

  /**
   * Dispatches a job. If pg-boss is active, sends to pg-boss; otherwise queues in memory
   * and can optionally process synchronously in test mode.
   */
  public async dispatch<T = any>(
    name: JobName,
    data: T,
    options?: { retryLimit?: number; retryDelay?: number; runImmediately?: boolean }
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // In production with pg-boss active
    if (this.pgBossInstance && typeof this.pgBossInstance.send === 'function') {
      try {
        const bossId = await this.pgBossInstance.send(name, data, {
          retryLimit: options?.retryLimit ?? 3,
          retryDelay: options?.retryDelay ?? 5,
        });
        logger.info({ name, bossId }, 'Dispatched job to pg-boss queue');
        return bossId || jobId;
      } catch (err) {
        logger.warn({ err, name }, 'Failed to dispatch to pg-boss, falling back to memory queue');
      }
    }

    // In-memory record for test verification
    this.inMemoryQueue.push({
      id: jobId,
      name,
      data,
      timestamp: new Date(),
    });

    if (options?.runImmediately) {
      await this.processJob(name, data);
    }

    return jobId;
  }

  /**
   * Executes all registered handlers for a specific job.
   */
  public async processJob(name: JobName, data: any): Promise<void> {
    const jobHandlers = this.handlers.get(name) || [];
    for (const handler of jobHandlers) {
      await handler(data);
    }
  }

  /**
   * Returns all queued jobs (useful for test assertions).
   */
  public getQueuedJobs(name?: JobName) {
    if (name) {
      return this.inMemoryQueue.filter((j) => j.name === name);
    }
    return [...this.inMemoryQueue];
  }

  /**
   * Clears the in-memory test queue.
   */
  public clearQueue(): void {
    this.inMemoryQueue = [];
  }
}

export const queueService = new QueueService();
