import { sql, eq, or, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';
import { publicDevelopers, type PublicDeveloperRow } from '../db/schema/views.js';

export class DevelopersRepository {
  async getDevelopers(countryCode?: string): Promise<PublicDeveloperRow[]> {
    return withActor(db, { role: 'public' }, async (tx) => {
      if (countryCode) {
        return tx
          .select()
          .from(publicDevelopers)
          .where(
            or(
              eq(publicDevelopers.countryCode, countryCode),
              sql`${countryCode} = ANY(${publicDevelopers.operatingMarkets})`
            )
          )
          .orderBy(asc(publicDevelopers.name));
      }

      return tx
        .select()
        .from(publicDevelopers)
        .orderBy(asc(publicDevelopers.name));
    });
  }

  async getDeveloperByIdOrSlug(idOrSlug: string): Promise<PublicDeveloperRow | null> {
    return withActor(db, { role: 'public' }, async (tx) => {
      // Check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      if (isUuid) {
        const rows = await tx
          .select()
          .from(publicDevelopers)
          .where(or(eq(publicDevelopers.id, idOrSlug), eq(publicDevelopers.slug, idOrSlug)))
          .limit(1);
        return rows[0] || null;
      }

      const rows = await tx
        .select()
        .from(publicDevelopers)
        .where(eq(publicDevelopers.slug, idOrSlug))
        .limit(1);
      return rows[0] || null;
    });
  }

  async getListingCountsByDeveloper(): Promise<Map<string, number>> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const countsRes = (await tx.execute(sql`
        SELECT developer_id, count(*)::int as count
        FROM public_listings
        WHERE developer_id IS NOT NULL
        GROUP BY developer_id
      `)) as { rows: Array<{ developer_id: string; count: number }> };

      const map = new Map<string, number>();
      for (const row of countsRes.rows) {
        if (row.developer_id) {
          map.set(row.developer_id, Number(row.count));
        }
      }
      return map;
    });
  }
}

export const developersRepository = new DevelopersRepository();
