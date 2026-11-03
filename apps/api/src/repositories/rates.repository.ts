import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';
import { publicRates, type PublicRatesRow } from '../db/schema/views.js';

export class RatesRepository {
  async getRates(): Promise<PublicRatesRow | null> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const rows = await tx
        .select()
        .from(publicRates)
        .where(eq(publicRates.base, 'USD'))
        .limit(1);

      return rows[0] || null;
    });
  }
}

export const ratesRepository = new RatesRepository();

