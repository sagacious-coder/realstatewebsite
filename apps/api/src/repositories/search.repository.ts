import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';

export interface LocationSuggestionRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  countryCode: string;
  parentId: string | null;
}

export interface DeveloperSuggestionRow {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
}

export interface ProjectSuggestionRow {
  id: string;
  name: string;
  slug: string;
  developerName: string;
  countryCode: string;
}

export interface ListingSuggestionRow {
  id: string;
  refNumber: string;
  slug: string;
  title: string;
  countryCode: string;
}

export class SearchRepository {
  async getSuggestions(
    rawQuery: string,
    countryCode?: string
  ): Promise<{
    locations: LocationSuggestionRow[];
    developers: DeveloperSuggestionRow[];
    projects: ProjectSuggestionRow[];
    listings: ListingSuggestionRow[];
  }> {
    const q = rawQuery.trim();
    if (!q) {
      return { locations: [], developers: [], projects: [], listings: [] };
    }

    return withActor(db, { role: 'public' }, async (tx) => {
      const countryCondition = countryCode ? sql`AND country_code = ${countryCode.toLowerCase()}` : sql``;

      const [locRes, devRes, projRes, listRes] = (await Promise.all([
        // 1. Locations
        tx.execute(sql`
          SELECT id, name, slug, type, country_code as "countryCode", parent_id as "parentId"
          FROM public_locations
          WHERE (
            normalize_search(name) LIKE '%' || normalize_search(${q}) || '%'
            OR similarity(normalize_search(name), normalize_search(${q})) > 0.2
          )
          ${countryCondition}
          ORDER BY similarity(normalize_search(name), normalize_search(${q})) DESC, name ASC
          LIMIT 10
        `),

        // 2. Developers
        tx.execute(sql`
          SELECT id, name, slug, country_code as "countryCode"
          FROM public_developers
          WHERE (
            normalize_search(name) LIKE '%' || normalize_search(${q}) || '%'
            OR similarity(normalize_search(name), normalize_search(${q})) > 0.2
          )
          ${countryCode ? sql`AND (country_code = ${countryCode.toLowerCase()} OR ${countryCode.toLowerCase()} = ANY(operating_markets))` : sql``}
          ORDER BY similarity(normalize_search(name), normalize_search(${q})) DESC, name ASC
          LIMIT 10
        `),

        // 3. Projects
        tx.execute(sql`
          SELECT
            p.id,
            p.name,
            p.slug,
            coalesce(d.name, '') as "developerName",
            p.country_code as "countryCode"
          FROM public_projects p
          LEFT JOIN public_developers d ON d.id = p.developer_id
          WHERE (
            normalize_search(p.name) LIKE '%' || normalize_search(${q}) || '%'
            OR similarity(normalize_search(p.name), normalize_search(${q})) > 0.2
          )
          ${countryCode ? sql`AND p.country_code = ${countryCode.toLowerCase()}` : sql``}
          ORDER BY similarity(normalize_search(p.name), normalize_search(${q})) DESC, p.name ASC
          LIMIT 10
        `),

        // 4. Listings
        tx.execute(sql`
          SELECT id, ref_number as "refNumber", slug, title, country_code as "countryCode"
          FROM public_listings
          WHERE (
            normalize_search(ref_number) LIKE '%' || normalize_search(${q}) || '%'
            OR normalize_search(title) LIKE '%' || normalize_search(${q}) || '%'
            OR similarity(normalize_search(title), normalize_search(${q})) > 0.2
          )
          ${countryCondition}
          ORDER BY similarity(normalize_search(title), normalize_search(${q})) DESC, published_at DESC
          LIMIT 10
        `),
      ])) as [
        { rows: LocationSuggestionRow[] },
        { rows: DeveloperSuggestionRow[] },
        { rows: ProjectSuggestionRow[] },
        { rows: ListingSuggestionRow[] }
      ];

      return {
        locations: (locRes.rows || []) as LocationSuggestionRow[],
        developers: (devRes.rows || []) as DeveloperSuggestionRow[],
        projects: (projRes.rows || []) as ProjectSuggestionRow[],
        listings: (listRes.rows || []) as ListingSuggestionRow[],
      };
    });
  }
}

export const searchRepository = new SearchRepository();
