import { eq, and } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDatabase } from '../db/index.js';
import { withActor } from '../db/context.js';
import {
  leads,
  type LeadRow,
  type NewLeadRow,
} from '../db/schema/leads.js';
import {
  idempotencyRecords,
  type IdempotencyRecordRow,
} from '../db/schema/system.js';

export class LeadsRepository {
  /**
   * Retrieves an idempotency record by key and endpoint.
   */
  async findIdempotency(
    key: string,
    endpoint: string
  ): Promise<IdempotencyRecordRow | null> {
    const db = getDatabase();
    return await withActor(db, { role: 'public' }, async (tx) => {
      const rows = await tx
        .select()
        .from(idempotencyRecords)
        .where(
          and(
            eq(idempotencyRecords.key, key),
            eq(idempotencyRecords.endpoint, endpoint)
          )
        )
        .limit(1);

      return rows[0] || null;
    });
  }

  /**
   * Saves an idempotency record for a completed request.
   */
  async saveIdempotency(
    key: string,
    endpoint: string,
    statusCode: number,
    responseBody: any
  ): Promise<void> {
    const db = getDatabase();
    await withActor(db, { role: 'public' }, async (tx) => {
      await tx
        .insert(idempotencyRecords)
        .values({
          key,
          endpoint,
          statusCode,
          responseBody,
        })
        .onConflictDoNothing();
    });
  }

  /**
   * Inserts a new lead record under public actor role.
   */
  async createLead(leadData: NewLeadRow): Promise<LeadRow> {
    const db = getDatabase();
    const id = leadData.id || uuidv7();
    const leadRecord: NewLeadRow = {
      ...leadData,
      id,
    };

    await withActor(db, { role: 'public' }, async (tx) => {
      await tx.insert(leads).values(leadRecord);
    });

    return leadRecord as LeadRow;
  }

  /**
   * Finds a lead by UUID.
   */
  async findLeadById(id: string): Promise<LeadRow | null> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const rows = await tx.select().from(leads).where(eq(leads.id, id)).limit(1);
      return rows[0] || null;
    });
  }
}

export const leadsRepository = new LeadsRepository();
