import { sql, eq, and, or, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';
import { publicLocations, type PublicLocationRow } from '../db/schema/views.js';
import { publicListings } from '../db/schema/views.js';

export class LocationsRepository {
  async getLocations(countryCode?: string): Promise<PublicLocationRow[]> {
    return withActor(db, { role: 'public' }, async (tx) => {
      if (countryCode) {
        return tx
          .select()
          .from(publicLocations)
          .where(eq(publicLocations.countryCode, countryCode))
          .orderBy(asc(publicLocations.featuredOrder), asc(publicLocations.name));
      }

      return tx
        .select()
        .from(publicLocations)
        .orderBy(asc(publicLocations.featuredOrder), asc(publicLocations.name));
    });
  }

  async getLocationBySlug(slug: string): Promise<PublicLocationRow | null> {
    return this.getLocationByIdOrSlug(slug);
  }

  async getLocationByIdOrSlug(idOrSlug: string): Promise<PublicLocationRow | null> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      if (isUuid) {
        const rows = await tx
          .select()
          .from(publicLocations)
          .where(or(eq(publicLocations.id, idOrSlug), eq(publicLocations.slug, idOrSlug)))
          .limit(1);
        return rows[0] || null;
      }

      const rows = await tx
        .select()
        .from(publicLocations)
        .where(eq(publicLocations.slug, idOrSlug))
        .limit(1);

      return rows[0] || null;
    });
  }

  async getListingCountsByLocation(): Promise<Map<string, number>> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const cityCounts = (await tx.execute(sql`
        SELECT city, count(*)::int as count
        FROM public_listings
        GROUP BY city
      `)) as { rows: Array<{ city: string; count: number }> };

      const areaCounts = (await tx.execute(sql`
        SELECT area, count(*)::int as count
        FROM public_listings
        WHERE area IS NOT NULL
        GROUP BY area
      `)) as { rows: Array<{ area: string; count: number }> };

      const counts = new Map<string, number>();

      for (const row of cityCounts.rows) {
        if (row.city) {
          counts.set(row.city.toLowerCase(), Number(row.count));
        }
      }

      for (const row of areaCounts.rows) {
        if (row.area) {
          counts.set(row.area.toLowerCase(), Number(row.count));
        }
      }

      return counts;
    });
  }
}

export const locationsRepository = new LocationsRepository();
