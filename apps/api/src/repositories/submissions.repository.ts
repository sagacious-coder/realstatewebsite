import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDatabase } from '../db/index.js';
import { withActor } from '../db/context.js';
import {
  submissions,
  submissionDocuments,
  type SubmissionRow,
  type NewSubmissionRow,
  type SubmissionDocumentRow,
} from '../db/schema/leads.js';

export class SubmissionsRepository {
  /**
   * Inserts a property submission under public actor role.
   */
  async createSubmission(
    submissionData: NewSubmissionRow
  ): Promise<SubmissionRow> {
    const db = getDatabase();
    const id = submissionData.id || uuidv7();
    const submissionRecord: NewSubmissionRow = {
      ...submissionData,
      id,
    };

    await withActor(db, { role: 'public' }, async (tx) => {
      await tx.insert(submissions).values(submissionRecord);
    });

    return submissionRecord as SubmissionRow;
  }

  /**
   * Finds a submission by UUID under staff or submitter capability token actor role.
   */
  async findSubmissionById(
    id: string,
    capabilityToken?: string
  ): Promise<SubmissionRow | null> {
    const db = getDatabase();
    const actor = capabilityToken
      ? { role: 'seller' as const, submissionToken: capabilityToken }
      : { role: 'admin' as const };

    return await withActor(db, actor, async (tx) => {
      const rows = await tx
        .select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);

      return rows[0] || null;
    });
  }

  /**
   * Inserts an attachment or document record associated with a submission.
   */
  async createSubmissionDocument(
    documentData: typeof submissionDocuments.$inferInsert
  ): Promise<SubmissionDocumentRow> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      const rows = await tx
        .insert(submissionDocuments)
        .values(documentData)
        .returning();

      if (!rows[0]) {
        throw new Error('Failed to insert submission document');
      }
      return rows[0];
    });
  }

  /**
   * Retrieves all documents for a submission.
   */
  async getSubmissionDocuments(
    submissionId: string
  ): Promise<SubmissionDocumentRow[]> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      return await tx
        .select()
        .from(submissionDocuments)
        .where(eq(submissionDocuments.submissionId, submissionId));
    });
  }
}

export const submissionsRepository = new SubmissionsRepository();
