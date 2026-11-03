import { sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';
import {
  publicListings,
  publicListingImages,
  publicDevelopers,
  publicProjects,
  type PublicListingRow,
  type PublicListingImageRow,
  type PublicDeveloperRow,
  type PublicProjectRow,
} from '../db/schema/views.js';
import type { FacetCounts } from '@wild-hills/contracts';

export interface NormalizedSearchFilters {
  q?: string;
  country?: string;
  city?: string;
  area?: string;
  types?: string[];
  statuses?: string[];
  minUsdMinor?: number;
  maxUsdMinor?: number;
  beds?: number[];
  minBeds?: number;
  exactBeds?: number;
  baths?: number;
  minSqm?: number;
  maxSqm?: number;
  handoverYear?: number;
  features?: string[];
  developer?: string;
  project?: string;
  isFeatured?: boolean;
  isHotDeal?: boolean;
  isNewLaunch?: boolean;
  isVerified?: boolean;
  hasInstallments?: boolean;
}

export type ListingSortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'beds_asc'
  | 'beds_desc'
  | 'size_desc';

const SORT_ALLOWLIST: Record<ListingSortOption, SQL> = {
  featured: sql`is_featured DESC, published_at DESC, id ASC`,
  price_asc: sql`price_usd_minor ASC, id ASC`,
  price_desc: sql`price_usd_minor DESC, id ASC`,
  newest: sql`published_at DESC, id ASC`,
  beds_asc: sql`bedrooms ASC, id ASC`,
  beds_desc: sql`bedrooms DESC, id ASC`,
  size_desc: sql`size_sqm DESC, id ASC`,
};

export class ListingsRepository {
  buildFilterConditions(filters: NormalizedSearchFilters): SQL[] {
    const conditions: SQL[] = [];

    if (filters.country) {
      conditions.push(sql`country_code = ${filters.country.toLowerCase()}`);
    }

    if (filters.city) {
      conditions.push(
        sql`(lower(city) = lower(${filters.city}) OR normalize_search(city) = normalize_search(${filters.city}))`
      );
    }

    if (filters.area) {
      conditions.push(
        sql`(lower(area) = lower(${filters.area}) OR normalize_search(area) = normalize_search(${filters.area}))`
      );
    }

    if (filters.types && filters.types.length > 0) {
      conditions.push(sql`property_type = ANY(ARRAY[${sql.join(filters.types.map((t) => sql`${t}`), sql`, `)}]::text[])`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      conditions.push(sql`status = ANY(ARRAY[${sql.join(filters.statuses.map((s) => sql`${s}`), sql`, `)}]::text[])`);
    }

    if (filters.minUsdMinor !== undefined) {
      conditions.push(sql`price_usd_minor >= ${filters.minUsdMinor}`);
    }

    if (filters.maxUsdMinor !== undefined) {
      conditions.push(sql`price_usd_minor <= ${filters.maxUsdMinor}`);
    }

    if (filters.exactBeds !== undefined) {
      conditions.push(sql`bedrooms = ${filters.exactBeds}`);
    } else if (filters.minBeds !== undefined) {
      conditions.push(sql`bedrooms >= ${filters.minBeds}`);
    } else if (filters.beds && filters.beds.length > 0) {
      conditions.push(sql`bedrooms = ANY(ARRAY[${sql.join(filters.beds.map((b) => sql`${b}`), sql`, `)}]::int[])`);
    }

    if (filters.baths !== undefined) {
      conditions.push(sql`bathrooms >= ${filters.baths}`);
    }

    if (filters.minSqm !== undefined) {
      conditions.push(sql`size_sqm >= ${filters.minSqm}`);
    }

    if (filters.maxSqm !== undefined) {
      conditions.push(sql`size_sqm <= ${filters.maxSqm}`);
    }

    if (filters.handoverYear !== undefined) {
      conditions.push(sql`completion_year = ${filters.handoverYear}`);
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(sql`is_featured = ${filters.isFeatured}`);
    }

    if (filters.isHotDeal) {
      conditions.push(sql`is_hot_deal = true`);
    }

    if (filters.isNewLaunch) {
      conditions.push(sql`is_new_launch = true`);
    }

    if (filters.isVerified) {
      conditions.push(sql`is_verified = true`);
    }

    if (filters.hasInstallments) {
      conditions.push(sql`payment_plan IS NOT NULL`);
    }

    if (filters.features && filters.features.length > 0) {
      for (const feat of filters.features) {
        conditions.push(sql`${feat} = ANY(features)`);
      }
    }

    if (filters.developer) {
      conditions.push(sql`
        (
          developer_id::text = ${filters.developer}
          OR developer_id IN (
            SELECT id FROM public_developers
            WHERE slug = ${filters.developer}
               OR normalize_search(name) LIKE '%' || normalize_search(${filters.developer}) || '%'
          )
        )
      `);
    }

    if (filters.project) {
      conditions.push(sql`
        (
          project_id::text = ${filters.project}
          OR project_id IN (
            SELECT id FROM public_projects
            WHERE slug = ${filters.project}
               OR normalize_search(name) LIKE '%' || normalize_search(${filters.project}) || '%'
          )
        )
      `);
    }

    if (filters.q && filters.q.trim()) {
      const query = filters.q.trim();
      conditions.push(sql`
        (
          normalize_search(ref_number) LIKE '%' || normalize_search(${query}) || '%'
          OR normalize_search(title) LIKE '%' || normalize_search(${query}) || '%'
          OR normalize_search(coalesce(description, '')) LIKE '%' || normalize_search(${query}) || '%'
          OR normalize_search(city) LIKE '%' || normalize_search(${query}) || '%'
          OR normalize_search(coalesce(area, '')) LIKE '%' || normalize_search(${query}) || '%'
          OR similarity(normalize_search(title), normalize_search(${query})) > 0.2
        )
      `);
    }

    return conditions;
  }

  async searchListings(
    filters: NormalizedSearchFilters,
    sortOption: ListingSortOption = 'featured',
    pagination: { offset: number; limit: number }
  ): Promise<{ items: PublicListingRow[]; total: number }> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const conditions = this.buildFilterConditions(filters);
      const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

      // Allow-listed sort strictly using SORT_ALLOWLIST map (Rule 15)
      const orderClause = SORT_ALLOWLIST[sortOption] || SORT_ALLOWLIST.featured;

      const itemsQuery = sql`
        SELECT *
        FROM public_listings
        ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ${pagination.limit}
        OFFSET ${pagination.offset}
      `;

      const countQuery = sql`
        SELECT count(*)::int as total
        FROM public_listings
        ${whereClause}
      `;

      const [itemsRes, countRes] = await Promise.all([
        tx.execute(itemsQuery),
        tx.execute(countQuery) as Promise<{ rows: Array<{ total: number }> }>,
      ]);

      const items = (itemsRes.rows || []) as PublicListingRow[];
      const total = Number(countRes.rows[0]?.total ?? 0);

      return { items, total };
    });
  }

  async getListingImages(listingIds: string[]): Promise<Map<string, PublicListingImageRow[]>> {
    if (listingIds.length === 0) return new Map();

    return withActor(db, { role: 'public' }, async (tx) => {
      const res = await tx.execute(sql`
        SELECT *
        FROM public_listing_images
        WHERE listing_id = ANY(ARRAY[${sql.join(listingIds.map((id) => sql`${id}::uuid`), sql`, `)}])
        ORDER BY "order" ASC
      `);

      const map = new Map<string, PublicListingImageRow[]>();
      for (const row of (res.rows || []) as PublicListingImageRow[]) {
        const list = map.get(row.listingId) || [];
        list.push(row);
        map.set(row.listingId, list);
      }
      return map;
    });
  }

  async getListingByRefOrSlug(refOrSlug: string): Promise<{
    listing: PublicListingRow;
    images: PublicListingImageRow[];
    developer?: PublicDeveloperRow;
    project?: PublicProjectRow;
  } | null> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const listingRes = await tx.execute(sql`
        SELECT *
        FROM public_listings
        WHERE slug = ${refOrSlug} OR lower(ref_number) = lower(${refOrSlug})
        LIMIT 1
      `);

      const listing = (listingRes.rows[0] as PublicListingRow) || null;
      if (!listing) return null;

      const [imagesRes, devRes, projRes] = await Promise.all([
        tx.execute(sql`
          SELECT *
          FROM public_listing_images
          WHERE listing_id = ${listing.id}::uuid
          ORDER BY "order" ASC
        `),
        listing.developerId
          ? tx.execute(sql`SELECT * FROM public_developers WHERE id = ${listing.developerId}::uuid LIMIT 1`)
          : Promise.resolve({ rows: [] }),
        listing.projectId
          ? tx.execute(sql`SELECT * FROM public_projects WHERE id = ${listing.projectId}::uuid LIMIT 1`)
          : Promise.resolve({ rows: [] }),
      ]);

      return {
        listing,
        images: (imagesRes.rows || []) as PublicListingImageRow[],
        developer: (devRes.rows[0] as PublicDeveloperRow) || undefined,
        project: (projRes.rows[0] as PublicProjectRow) || undefined,
      };
    });
  }

  async getFacets(filters: NormalizedSearchFilters): Promise<FacetCounts> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const conditions = this.buildFilterConditions(filters);
      const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

      const [typeRes, cityRes, statusRes, priceRangeRes] = (await Promise.all([
        tx.execute(sql`
          SELECT property_type, count(*)::int as count
          FROM public_listings
          ${whereClause}
          GROUP BY property_type
        `),
        tx.execute(sql`
          SELECT city, count(*)::int as count
          FROM public_listings
          ${whereClause}
          GROUP BY city
        `),
        tx.execute(sql`
          SELECT status, count(*)::int as count
          FROM public_listings
          ${whereClause}
          GROUP BY status
        `),
        tx.execute(sql`
          SELECT
            coalesce(min(price_usd_minor), 0)::bigint as min_usd,
            coalesce(max(price_usd_minor), 0)::bigint as max_usd
          FROM public_listings
          ${whereClause}
        `),
      ])) as [
        { rows: Array<{ property_type: string; count: number }> },
        { rows: Array<{ city: string; count: number }> },
        { rows: Array<{ status: string; count: number }> },
        { rows: Array<{ min_usd: number; max_usd: number }> }
      ];

      const byType: Record<string, number> = {};
      for (const row of typeRes.rows) {
        byType[row.property_type] = Number(row.count);
      }

      const byCity: Record<string, number> = {};
      for (const row of cityRes.rows) {
        byCity[row.city] = Number(row.count);
      }

      const byStatus: Record<string, number> = {};
      for (const row of statusRes.rows) {
        byStatus[row.status] = Number(row.count);
      }

      const minUsd = priceRangeRes.rows[0] ? Number(priceRangeRes.rows[0].min_usd) : 0;
      const maxUsd = priceRangeRes.rows[0] ? Number(priceRangeRes.rows[0].max_usd) : 0;

      return {
        byType,
        byCity,
        byStatus,
        priceRange: {
          minUsdMinor: minUsd,
          maxUsdMinor: maxUsd,
        },
      };
    });
  }

  async getEntityBriefs(
    developerIds: string[],
    projectIds: string[]
  ): Promise<{
    developers: Map<string, { id: string; name: string; slug: string }>;
    projects: Map<string, { id: string; name: string; slug: string }>;
  }> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const validDevIds = developerIds.filter(Boolean);
      const validProjIds = projectIds.filter(Boolean);

      const [devRes, projRes] = (await Promise.all([
        validDevIds.length > 0
          ? tx.execute(sql`
              SELECT id, name, slug
              FROM public_developers
              WHERE id = ANY(ARRAY[${sql.join(validDevIds.map((id) => sql`${id}::uuid`), sql`, `)}])
            `)
          : Promise.resolve({ rows: [] }),
        validProjIds.length > 0
          ? tx.execute(sql`
              SELECT id, name, slug
              FROM public_projects
              WHERE id = ANY(ARRAY[${sql.join(validProjIds.map((id) => sql`${id}::uuid`), sql`, `)}])
            `)
          : Promise.resolve({ rows: [] }),
      ])) as [
        { rows: Array<{ id: string; name: string; slug: string }> },
        { rows: Array<{ id: string; name: string; slug: string }> }
      ];

      const developers = new Map<string, { id: string; name: string; slug: string }>();
      for (const row of devRes.rows) {
        developers.set(row.id, { id: row.id, name: row.name, slug: row.slug });
      }

      const projects = new Map<string, { id: string; name: string; slug: string }>();
      for (const row of projRes.rows) {
        projects.set(row.id, { id: row.id, name: row.name, slug: row.slug });
      }

      return { developers, projects };
    });
  }
}

export const listingsRepository = new ListingsRepository();
