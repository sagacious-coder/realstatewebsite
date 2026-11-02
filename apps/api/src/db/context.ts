import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export interface Actor {
  userId?: string;
  role: 'owner' | 'admin' | 'agent' | 'editor' | 'public' | 'seller';
  countryScopes?: string[];
  submissionToken?: string;
}

/**
 * Executes a database operation within a transaction, configuring PostgreSQL
 * session settings for Row-Level Security (RLS) enforcement.
 */
export async function withActor<T>(
  db: NodePgDatabase<typeof schema> | any,
  actor: Actor,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx: any) => {
    // 1. Switch to least-privilege role so RLS is evaluated (superusers bypass RLS)
    if (actor.role === 'public' || actor.role === 'seller') {
      await tx.execute(sql`SET LOCAL ROLE wh_public_ro`);
    } else {
      await tx.execute(sql`SET LOCAL ROLE wh_api`);
    }

    // 2. Set current user ID
    if (actor.userId) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${actor.userId}, true)`);
    } else {
      await tx.execute(sql`SELECT set_config('app.current_user_id', '', true)`);
    }

    // 3. Set current role
    await tx.execute(sql`SELECT set_config('app.current_user_role', ${actor.role}, true)`);

    // 4. Set country scopes (e.g. 'ae,eg')
    const scopes = actor.countryScopes ? actor.countryScopes.join(',') : '';
    await tx.execute(sql`SELECT set_config('app.current_country_scopes', ${scopes}, true)`);

    // 5. Set submission capability token if present
    if (actor.submissionToken) {
      await tx.execute(sql`SELECT set_config('app.current_submission_token', ${actor.submissionToken}, true)`);
    } else {
      await tx.execute(sql`SELECT set_config('app.current_submission_token', '', true)`);
    }

    // Execute user callback within this transaction
    return await callback(tx);
  });
}
