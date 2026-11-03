import { eq, sql } from 'drizzle-orm';
import { getDatabase } from '../db/index.js';
import { withActor } from '../db/context.js';
import {
  usageCounters,
  emailOutbox,
  type UsageCounterRow,
  type EmailOutboxRow,
  type NewEmailOutboxRow,
} from '../db/schema/system.js';

export class UsageRepository {
  /**
   * Retrieves usage counters for a specific date (YYYY-MM-DD).
   */
  async getUsageForDate(dateStr: string): Promise<UsageCounterRow | null> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const rows = await tx
        .select()
        .from(usageCounters)
        .where(eq(usageCounters.date, dateStr))
        .limit(1);

      return rows[0] || null;
    });
  }

  /**
   * Increments daily email counter atomically.
   */
  async incrementEmailCount(dateStr: string, count = 1): Promise<number> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const existing = await tx
        .select()
        .from(usageCounters)
        .where(eq(usageCounters.date, dateStr))
        .limit(1);

      if (existing[0]) {
        const updated = await tx
          .update(usageCounters)
          .set({
            emailCount: existing[0].emailCount + count,
            updatedAt: new Date(),
          })
          .where(eq(usageCounters.date, dateStr))
          .returning();

        return updated[0]?.emailCount ?? existing[0].emailCount + count;
      } else {
        const inserted = await tx
          .insert(usageCounters)
          .values({
            date: dateStr,
            emailCount: count,
            storageBytes: 0,
          })
          .returning();

        return inserted[0]?.emailCount ?? count;
      }
    });
  }

  /**
   * Updates current storage bytes.
   */
  async updateStorageBytes(bytesChange: number, dateStr: string): Promise<number> {
    const db = getDatabase();
    const roundedChange = Math.round(bytesChange);
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const existing = await tx
        .select()
        .from(usageCounters)
        .where(eq(usageCounters.date, dateStr))
        .limit(1);

      if (existing[0]) {
        const newBytes = Math.max(0, Math.round(existing[0].storageBytes + roundedChange));
        const updated = await tx
          .update(usageCounters)
          .set({
            storageBytes: newBytes,
            updatedAt: new Date(),
          })
          .where(eq(usageCounters.date, dateStr))
          .returning();

        return updated[0]?.storageBytes ?? newBytes;
      } else {
        const newBytes = Math.max(0, roundedChange);
        const inserted = await tx
          .insert(usageCounters)
          .values({
            date: dateStr,
            emailCount: 0,
            storageBytes: newBytes,
          })
          .returning();

        return inserted[0]?.storageBytes ?? newBytes;
      }
    });
  }

  /**
   * Resets usage counters for a specific date (useful for test isolation).
   */
  async resetDailyUsage(dateStr: string): Promise<void> {
    const db = getDatabase();
    await withActor(db, { role: 'admin' }, async (tx) => {
      await tx
        .update(usageCounters)
        .set({ emailCount: 0, updatedAt: new Date() })
        .where(eq(usageCounters.date, dateStr));
    });
  }

  /**
   * Retrieves the latest recorded storage bytes across all usage counters.
   */
  async getCurrentStorageBytes(): Promise<number> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const rows = await tx
        .select()
        .from(usageCounters)
        .orderBy(sql`${usageCounters.date} DESC`)
        .limit(1);

      return rows[0]?.storageBytes ?? 0;
    });
  }

  /**
   * Inserts an email into the transactional email outbox.
   */
  async insertEmailOutbox(data: NewEmailOutboxRow): Promise<EmailOutboxRow> {
    const db = getDatabase();
    return await withActor(db, { role: 'public' }, async (tx) => {
      const rows = await tx.insert(emailOutbox).values(data).returning();
      if (!rows[0]) {
        throw new Error('Failed to insert email outbox record');
      }
      return rows[0];
    });
  }

  /**
   * Updates an email outbox record status.
   */
  async updateEmailOutbox(
    id: string,
    updates: Partial<EmailOutboxRow>
  ): Promise<void> {
    const db = getDatabase();
    await withActor(db, { role: 'admin' }, async (tx) => {
      await tx
        .update(emailOutbox)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(emailOutbox.id, id));
    });
  }
}

export const usageRepository = new UsageRepository();
