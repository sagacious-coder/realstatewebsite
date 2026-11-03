import { eq } from 'drizzle-orm';
import { getDatabase } from '../db/index.js';
import { withActor } from '../db/context.js';
import { publicRates, type PublicRatesRow } from '../db/schema/views.js';
import { exchangeRates } from '../db/schema/system.js';

export class RatesRepository {
  async getRates(): Promise<PublicRatesRow | null> {
    const db = getDatabase();
    return withActor(db, { role: 'public' }, async (tx) => {
      const rows = await tx
        .select()
        .from(publicRates)
        .where(eq(publicRates.base, 'USD'))
        .limit(1);

      return rows[0] || null;
    });
  }

  async updateRates(base: string, ratesData: Record<string, number>): Promise<void> {
    const db = getDatabase();
    await withActor(db, { role: 'admin' }, async (tx) => {
      const existing = await tx
        .select()
        .from(exchangeRates)
        .where(eq(exchangeRates.base, base))
        .limit(1);

      if (existing[0]) {
        await tx
          .update(exchangeRates)
          .set({ rates: ratesData, updatedAt: new Date() })
          .where(eq(exchangeRates.base, base));
      } else {
        await tx.insert(exchangeRates).values({
          base,
          rates: ratesData,
          updatedAt: new Date(),
        });
      }
    });
  }
}

export const ratesRepository = new RatesRepository();

