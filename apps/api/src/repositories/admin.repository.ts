import { sql, eq, and, desc, asc, type SQL } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDatabase } from '../db/index.js';
import { withActor, type Actor } from '../db/context.js';
import {
  listings,
  listingImages,
  type ListingRow,
  type NewListingRow,
  type ListingImageRow,
} from '../db/schema/listings.js';
import {
  leads,
  leadNotes,
  submissions,
  submissionDocuments,
  type LeadRow,
  type SubmissionRow,
} from '../db/schema/leads.js';
import {
  locations,
  type LocationRow,
} from '../db/schema/locations.js';
import {
  developers,
  type DeveloperRow,
} from '../db/schema/developers.js';
import {
  auditLog,
  type AuditLogRow,
} from '../db/schema/audit.js';
import { exchangeRates } from '../db/schema/system.js';

export interface AdminListingFilters {
  country?: string;
  status?: string;
  propertyType?: string;
  developerId?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminLeadFilters {
  country?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditEventParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: any;
  actorEmail?: string;
  ipAddress?: string;
}

export class AdminRepository {
  // ============================================================================
  // AUDIT LOGGING HELPER
  // ============================================================================

  async recordAudit(actor: Actor, event: AuditEventParams, clientOrTx?: any): Promise<void> {
    const sanitizedChanges = { ...(event.changes || {}) };
    delete sanitizedChanges.password;
    delete sanitizedChanges.passwordHash;
    delete sanitizedChanges.token;
    delete sanitizedChanges.secret;

    const values = {
      actorId: actor.userId || null,
      actorEmail: event.actorEmail || null,
      actorRole: actor.role,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId || null,
      changes: sanitizedChanges,
      ipAddress: event.ipAddress || null,
      createdAt: new Date(),
    };

    if (clientOrTx) {
      await clientOrTx.insert(auditLog).values(values);
      return;
    }

    const db = getDatabase();
    await withActor(db, { role: 'admin' }, async (tx) => {
      await tx.insert(auditLog).values(values);
    });
  }

  // ============================================================================
  // 1. LISTINGS MANAGEMENT
  // ============================================================================

  async getAdminListings(
    actor: Actor,
    filters: AdminListingFilters = {}
  ): Promise<{ items: ListingRow[]; total: number }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const whereClauses: SQL[] = [];

      // Agent country scoping
      if (actor.role === 'agent' && actor.countryScopes && actor.countryScopes.length > 0) {
        whereClauses.push(
          sql`country_code = ANY(ARRAY[${sql.join(
            actor.countryScopes.map((c) => sql`${c.toLowerCase()}`),
            sql`, `
          )}])`
        );
      }

      if (filters.country) {
        whereClauses.push(sql`country_code = ${filters.country.toLowerCase()}`);
      }

      if (filters.status && filters.status !== 'all') {
        whereClauses.push(sql`review_status = ${filters.status}`);
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        whereClauses.push(sql`property_type = ${filters.propertyType}`);
      }

      if (filters.developerId) {
        whereClauses.push(sql`developer_id = ${filters.developerId}::uuid`);
      }

      if (filters.search && filters.search.trim()) {
        const q = `%${filters.search.trim().toLowerCase()}%`;
        whereClauses.push(
          sql`(LOWER(title) LIKE ${q} OR LOWER(ref_number) LIKE ${q} OR LOWER(city) LIKE ${q})`
        );
      }

      const whereSql =
        whereClauses.length > 0
          ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
          : sql``;

      // Count total
      const countRes = await tx.execute(
        sql`SELECT COUNT(*)::int as count FROM listings ${whereSql}`
      );
      const total = Number((countRes.rows[0] as any)?.count || 0);

      // Allow-listed sorting
      let orderSql = sql`ORDER BY updated_at DESC, id DESC`;
      if (filters.sort === 'price_asc') {
        orderSql = sql`ORDER BY price_usd_minor ASC, id ASC`;
      } else if (filters.sort === 'price_desc') {
        orderSql = sql`ORDER BY price_usd_minor DESC, id ASC`;
      } else if (filters.sort === 'ref') {
        orderSql = sql`ORDER BY ref_number ASC`;
      } else if (filters.sort === 'newest') {
        orderSql = sql`ORDER BY created_at DESC, id DESC`;
      }

      const rowsRes = await tx.execute(
        sql`SELECT * FROM listings ${whereSql} ${orderSql} LIMIT ${limit} OFFSET ${offset}`
      );

      return {
        items: rowsRes.rows as ListingRow[],
        total,
      };
    });
  }

  async getAdminListingById(
    actor: Actor,
    id: string
  ): Promise<{
    listing: ListingRow | null;
    images: ListingImageRow[];
    auditHistory: AuditLogRow[];
  }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      // Find listing by UUID, slug, or refNumber
      const rowsRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} OR ref_number = ${id} LIMIT 1`
      );

      const listing = (rowsRes.rows[0] as ListingRow) || null;
      if (!listing) {
        return { listing: null, images: [], auditHistory: [] };
      }

      // Check country scope for agents
      const listingCountry = (listing.countryCode || (listing as any).country_code || '').toLowerCase();
      if (
        actor.role === 'agent' &&
        actor.countryScopes &&
        !actor.countryScopes.map((c) => c.toLowerCase()).includes(listingCountry)
      ) {
        return { listing: null, images: [], auditHistory: [] };
      }

      // Fetch images
      const imagesRes = await tx.execute(
        sql`SELECT * FROM listing_images WHERE listing_id = ${listing.id}::uuid ORDER BY "order" ASC`
      );

      // Fetch audit history
      const auditRes = await tx.execute(
        sql`SELECT * FROM audit_log WHERE resource_type = 'listing' AND resource_id = ${listing.id}::text ORDER BY created_at DESC LIMIT 50`
      );

      return {
        listing,
        images: imagesRes.rows as ListingImageRow[],
        auditHistory: auditRes.rows as AuditLogRow[],
      };
    });
  }

  async createListing(
    actor: Actor,
    data: NewListingRow,
    images: Array<{ url: string; alt?: string; order?: number }> = []
  ): Promise<ListingRow> {
    const db = getDatabase();
    const id = data.id || uuidv7();

    const country = data.countryCode.toLowerCase();
    const randCode = Math.floor(100 + Math.random() * 900);
    const refNumber =
      data.refNumber || `WH-${country.toUpperCase()}-${randCode}`;
    const slug =
      data.slug ||
      `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randCode}`;

    const sizeSqft =
      data.sizeSqft !== undefined && data.sizeSqft !== null
        ? String(data.sizeSqft)
        : String(Math.round(Number(data.sizeSqm || 0) * 10.7639));
    const sizeSqm = String(data.sizeSqm || '0');
    const bathrooms = String(data.bathrooms || '1');
    const agent = data.agent || {
      name: 'Wild Hills Private Office',
      phone: '+971 50 680 2332',
      whatsapp: '+971506802332',
      email: 'walidward@gmail.com',
      avatarUrl: '/images/logo-icon.svg',
      license: '501-2026-200074238',
    };

    const newListing: NewListingRow = {
      ...data,
      id,
      refNumber,
      slug,
      sizeSqm,
      sizeSqft,
      bathrooms,
      agent,
      reviewStatus: data.reviewStatus || 'draft',
      version: 1,
    };

    return await withActor(db, actor, async (tx) => {
      await tx.insert(listings).values(newListing);

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i]!;
          await tx.insert(listingImages).values({
            listingId: id,
            url: img.url,
            alt: img.alt || null,
            order: img.order !== undefined ? img.order : i,
          });
        }
      }

      // Record audit event
      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.create',
          resourceType: 'listing',
          resourceId: id,
          changes: { title: newListing.title, refNumber, countryCode: country },
        },
        tx
      );

      const res = await tx.execute(
        sql`SELECT * FROM listings WHERE id = ${id}::uuid LIMIT 1`
      );
      return res.rows[0] as ListingRow;
    });
  }

  async updateListing(
    actor: Actor,
    id: string,
    updates: Partial<ListingRow>,
    expectedVersion?: number,
    images?: Array<{ url: string; alt?: string; order?: number }>
  ): Promise<ListingRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const existingRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} LIMIT 1`
      );
      const existing = (existingRes.rows[0] as ListingRow) || null;
      if (!existing) {
        throw new Error('Listing not found');
      }

      // Country scope check for agents
      const existingCountry = (existing.countryCode || (existing as any).country_code || '').toLowerCase();
      if (
        actor.role === 'agent' &&
        actor.countryScopes &&
        !actor.countryScopes.map((c) => c.toLowerCase()).includes(existingCountry)
      ) {
        const error = new Error(`Cannot update listing outside country scopes`);
        (error as any).statusCode = 403;
        throw error;
      }

      // Optimistic concurrency locking
      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        const error = new Error(
          `Conflict: Listing has been modified by another user (current version: ${existing.version}, expected: ${expectedVersion})`
        );
        (error as any).statusCode = 409;
        throw error;
      }

      const nextVersion = existing.version + 1;
      const cleanUpdates: any = { ...updates };
      delete cleanUpdates.id;
      if (cleanUpdates.sizeSqm && !cleanUpdates.sizeSqft) {
        cleanUpdates.sizeSqft = String(Math.round(Number(cleanUpdates.sizeSqm) * 10.7639));
      }
      if (cleanUpdates.sizeSqm) cleanUpdates.sizeSqm = String(cleanUpdates.sizeSqm);
      if (cleanUpdates.sizeSqft) cleanUpdates.sizeSqft = String(cleanUpdates.sizeSqft);
      if (cleanUpdates.bathrooms) cleanUpdates.bathrooms = String(cleanUpdates.bathrooms);
      cleanUpdates.version = nextVersion;
      cleanUpdates.updatedAt = new Date();

      await tx
        .update(listings)
        .set(cleanUpdates)
        .where(eq(listings.id, existing.id));

      if (images !== undefined) {
        await tx
          .delete(listingImages)
          .where(eq(listingImages.listingId, existing.id));

        for (let i = 0; i < images.length; i++) {
          const img = images[i]!;
          await tx.insert(listingImages).values({
            listingId: existing.id,
            url: img.url,
            alt: img.alt || null,
            order: img.order !== undefined ? img.order : i,
          });
        }
      }

      // Record audit event
      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.update',
          resourceType: 'listing',
          resourceId: existing.id,
          changes: updates,
        },
        tx
      );

      const updatedRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id = ${existing.id}::uuid LIMIT 1`
      );
      return updatedRes.rows[0] as ListingRow;
    });
  }

  async publishListing(actor: Actor, id: string): Promise<ListingRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const existingRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} LIMIT 1`
      );
      const existing = (existingRes.rows[0] as ListingRow) || null;
      if (!existing) throw new Error('Listing not found');

      // Update to published - trigger trg_publish_guard validates invariants
      await tx
        .update(listings)
        .set({
          reviewStatus: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
          version: existing.version + 1,
        })
        .where(eq(listings.id, existing.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.publish',
          resourceType: 'listing',
          resourceId: existing.id,
          changes: { reviewStatus: 'published' },
        },
        tx
      );

      const updatedRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id = ${existing.id}::uuid LIMIT 1`
      );
      return updatedRes.rows[0] as ListingRow;
    });
  }

  async unpublishListing(actor: Actor, id: string): Promise<ListingRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const existingRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} LIMIT 1`
      );
      const existing = (existingRes.rows[0] as ListingRow) || null;
      if (!existing) throw new Error('Listing not found');

      await tx
        .update(listings)
        .set({
          reviewStatus: 'draft',
          updatedAt: new Date(),
          version: existing.version + 1,
        })
        .where(eq(listings.id, existing.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.unpublish',
          resourceType: 'listing',
          resourceId: existing.id,
          changes: { reviewStatus: 'draft' },
        },
        tx
      );

      const updatedRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id = ${existing.id}::uuid LIMIT 1`
      );
      return updatedRes.rows[0] as ListingRow;
    });
  }

  async duplicateListing(actor: Actor, id: string): Promise<ListingRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const existingRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} LIMIT 1`
      );
      const existing = (existingRes.rows[0] as any) || null;
      if (!existing) throw new Error('Listing not found');

      const country = (existing.countryCode || existing.country_code || 'ae').toLowerCase();
      const rand = Math.floor(100 + Math.random() * 900);
      const newId = uuidv7();
      const newRef = `WH-${country.toUpperCase()}-${rand}`;
      const newSlug = `${existing.slug || 'listing'}-copy-${rand}`;

      const duplicateData: NewListingRow = {
        id: newId,
        refNumber: newRef,
        slug: newSlug,
        title: `${existing.title} (Copy)`,
        description: existing.description || null,
        countryCode: country,
        locationId: existing.locationId || existing.location_id || null,
        city: existing.city,
        area: existing.area || null,
        developerId: existing.developerId || existing.developer_id || null,
        projectId: existing.projectId || existing.project_id || null,
        propertyType: existing.propertyType || existing.property_type || 'apartment',
        status: existing.status || 'ready',
        reviewStatus: 'draft',
        priceMinor: Number(existing.priceMinor || existing.price_minor || 0),
        currency: existing.currency || 'USD',
        priceUsdMinor: Number(existing.priceUsdMinor || existing.price_usd_minor || 0),
        bedrooms: existing.bedrooms !== undefined ? existing.bedrooms : 0,
        bathrooms: String(existing.bathrooms || '1'),
        sizeSqm: String(existing.sizeSqm || existing.size_sqm || '0'),
        sizeSqft: String(existing.sizeSqft || existing.size_sqft || '0'),
        coverImage: existing.coverImage || existing.cover_image || '/images/default.webp',
        isHotDeal: false,
        isFeatured: false,
        isVerified: false,
        isNewLaunch: false,
        isSample: false,
        completionYear: existing.completionYear || existing.completion_year || null,
        furnishingStatus: existing.furnishingStatus || existing.furnishing_status || null,
        badges: existing.badges || [],
        features: existing.features || [],
        videoUrl: existing.videoUrl || existing.video_url || null,
        virtualTourUrl: existing.virtualTourUrl || existing.virtual_tour_url || null,
        floorPlans: existing.floorPlans || existing.floor_plans || [],
        paymentPlan: existing.paymentPlan || existing.payment_plan || null,
        agent: existing.agent || {
          name: 'Wild Hills Private Office',
          phone: '+971 4 321 0000',
          email: 'concierge@wildhills.com',
        },
        latitude: existing.latitude || null,
        longitude: existing.longitude || null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tx.insert(listings).values(duplicateData);

      // Copy images
      const imagesRes = await tx.execute(
        sql`SELECT * FROM listing_images WHERE listing_id = ${existing.id}::uuid`
      );
      for (const img of imagesRes.rows as ListingImageRow[]) {
        await tx.insert(listingImages).values({
          listingId: newId,
          url: img.url,
          alt: img.alt,
          order: img.order,
        });
      }

      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.duplicate',
          resourceType: 'listing',
          resourceId: newId,
          changes: { sourceListingId: existing.id, newRefNumber: newRef },
        },
        tx
      );

      const createdRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id = ${newId}::uuid LIMIT 1`
      );
      return createdRes.rows[0] as ListingRow;
    });
  }

  async deleteListing(actor: Actor, id: string): Promise<boolean> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const existingRes = await tx.execute(
        sql`SELECT * FROM listings WHERE id::text = ${id} OR slug = ${id} LIMIT 1`
      );
      const existing = (existingRes.rows[0] as ListingRow) || null;
      if (!existing) return false;

      // Soft delete per spec: set review_status = 'archived'
      await tx
        .update(listings)
        .set({ reviewStatus: 'archived', updatedAt: new Date() })
        .where(eq(listings.id, existing.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.listing.delete',
          resourceType: 'listing',
          resourceId: existing.id,
          changes: { reviewStatus: 'archived' },
        },
        tx
      );

      return true;
    });
  }

  // ============================================================================
  // 2. CRM LEADS & STAFF NOTES
  // ============================================================================

  async getAdminLeads(
    actor: Actor,
    filters: AdminLeadFilters = {}
  ): Promise<{ items: LeadRow[]; total: number }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const whereClauses: SQL[] = [];

      if (actor.role === 'agent' && actor.countryScopes && actor.countryScopes.length > 0) {
        whereClauses.push(
          sql`country_code = ANY(ARRAY[${sql.join(
            actor.countryScopes.map((c) => sql`${c.toLowerCase()}`),
            sql`, `
          )}])`
        );
      }

      if (filters.country) {
        whereClauses.push(sql`country_code = ${filters.country.toLowerCase()}`);
      }

      if (filters.status && filters.status !== 'all') {
        whereClauses.push(sql`status = ${filters.status}`);
      }

      if (filters.search && filters.search.trim()) {
        const q = `%${filters.search.trim().toLowerCase()}%`;
        whereClauses.push(
          sql`(LOWER(name) LIKE ${q} OR LOWER(email) LIKE ${q} OR LOWER(phone) LIKE ${q})`
        );
      }

      const whereSql =
        whereClauses.length > 0
          ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
          : sql``;

      const countRes = await tx.execute(
        sql`SELECT COUNT(*)::int as count FROM leads ${whereSql}`
      );
      const total = Number((countRes.rows[0] as any)?.count || 0);

      const rowsRes = await tx.execute(
        sql`SELECT * FROM leads ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      );

      return {
        items: rowsRes.rows as LeadRow[],
        total,
      };
    });
  }

  async getAdminLeadById(
    actor: Actor,
    id: string
  ): Promise<{
    lead: LeadRow | null;
    notes: Array<{ id: string; content: string; authorId?: string | null; createdAt: Date }>;
  }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const leadRes = await tx.execute(
        sql`SELECT * FROM leads WHERE id::text = ${id} LIMIT 1`
      );
      const lead = (leadRes.rows[0] as LeadRow) || null;
      if (!lead) return { lead: null, notes: [] };

      const notesRes = await tx.execute(
        sql`SELECT id, content, author_id as "authorId", created_at as "createdAt" FROM lead_notes WHERE lead_id = ${lead.id}::uuid ORDER BY created_at DESC`
      );

      return {
        lead,
        notes: notesRes.rows as any,
      };
    });
  }

  async updateLeadStatus(
    actor: Actor,
    id: string,
    newStatus: string
  ): Promise<boolean> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const leadRes = await tx.execute(
        sql`SELECT * FROM leads WHERE id::text = ${id} LIMIT 1`
      );
      const lead = (leadRes.rows[0] as LeadRow) || null;
      if (!lead) return false;

      await tx
        .update(leads)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.lead.status_update',
          resourceType: 'lead',
          resourceId: lead.id,
          changes: { previousStatus: lead.status, newStatus },
        },
        tx
      );

      return true;
    });
  }

  async addLeadNote(
    actor: Actor,
    leadId: string,
    content: string
  ): Promise<{ id: string; content: string; createdAt: Date }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const id = uuidv7();
      await tx.insert(leadNotes).values({
        id,
        leadId,
        authorId: actor.userId || null,
        content,
        createdAt: new Date(),
      });

      await this.recordAudit(
        actor,
        {
          action: 'admin.lead.note_add',
          resourceType: 'lead',
          resourceId: leadId,
          changes: { noteId: id },
        },
        tx
      );

      return {
        id,
        content,
        createdAt: new Date(),
      };
    });
  }

  async getLeadsForExport(actor: Actor, country?: string): Promise<LeadRow[]> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const whereClauses: SQL[] = [];

      if (actor.role === 'agent' && actor.countryScopes && actor.countryScopes.length > 0) {
        whereClauses.push(
          sql`country_code = ANY(ARRAY[${sql.join(
            actor.countryScopes.map((c) => sql`${c.toLowerCase()}`),
            sql`, `
          )}])`
        );
      }

      if (country) {
        whereClauses.push(sql`country_code = ${country.toLowerCase()}`);
      }

      const whereSql =
        whereClauses.length > 0
          ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
          : sql``;

      const rowsRes = await tx.execute(
        sql`SELECT * FROM leads ${whereSql} ORDER BY created_at DESC LIMIT 1000`
      );

      return rowsRes.rows as LeadRow[];
    });
  }

  // ============================================================================
  // 3. SELLER SUBMISSIONS REVIEW QUEUE
  // ============================================================================

  async getAdminSubmissions(
    actor: Actor,
    filters: { status?: string; country?: string; page?: number; limit?: number } = {}
  ): Promise<{ items: SubmissionRow[]; total: number }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(100, Math.max(1, filters.limit || 20));
      const offset = (page - 1) * limit;

      const whereClauses: SQL[] = [];

      if (actor.role === 'agent' && actor.countryScopes && actor.countryScopes.length > 0) {
        whereClauses.push(
          sql`country_code = ANY(ARRAY[${sql.join(
            actor.countryScopes.map((c) => sql`${c.toLowerCase()}`),
            sql`, `
          )}])`
        );
      }

      if (filters.country) {
        whereClauses.push(sql`country_code = ${filters.country.toLowerCase()}`);
      }

      if (filters.status && filters.status !== 'all') {
        whereClauses.push(sql`status = ${filters.status}`);
      }

      const whereSql =
        whereClauses.length > 0
          ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
          : sql``;

      const countRes = await tx.execute(
        sql`SELECT COUNT(*)::int as count FROM submissions ${whereSql}`
      );
      const total = Number((countRes.rows[0] as any)?.count || 0);

      const rowsRes = await tx.execute(
        sql`SELECT * FROM submissions ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      );

      return {
        items: rowsRes.rows as SubmissionRow[],
        total,
      };
    });
  }

  async getAdminSubmissionById(
    actor: Actor,
    id: string
  ): Promise<{
    submission: SubmissionRow | null;
    documents: Array<{ id: string; fileUrl: string; fileName: string; fileSizeBytes: number; contentType: string }>;
  }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const subRes = await tx.execute(
        sql`SELECT * FROM submissions WHERE id::text = ${id} LIMIT 1`
      );
      const submission = (subRes.rows[0] as SubmissionRow) || null;
      if (!submission) return { submission: null, documents: [] };

      const docsRes = await tx.execute(
        sql`SELECT id, file_url as "fileUrl", file_name as "fileName", file_size_bytes as "fileSizeBytes", content_type as "contentType" FROM submission_documents WHERE submission_id = ${submission.id}::uuid`
      );

      return {
        submission,
        documents: docsRes.rows as any,
      };
    });
  }

  async updateSubmissionStatus(
    actor: Actor,
    id: string,
    newStatus: string
  ): Promise<boolean> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const subRes = await tx.execute(
        sql`SELECT * FROM submissions WHERE id::text = ${id} LIMIT 1`
      );
      const submission = (subRes.rows[0] as SubmissionRow) || null;
      if (!submission) return false;

      await tx
        .update(submissions)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(submissions.id, submission.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.submission.status_update',
          resourceType: 'submission',
          resourceId: submission.id,
          changes: { previousStatus: submission.status, newStatus },
        },
        tx
      );

      return true;
    });
  }

  async convertSubmissionToDraft(
    actor: Actor,
    submissionId: string
  ): Promise<{ listingId: string; refNumber: string; success: boolean }> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const subRes = await tx.execute(
        sql`SELECT * FROM submissions WHERE id::text = ${submissionId} LIMIT 1`
      );
      const submission = (subRes.rows[0] as any) || null;
      if (!submission) throw new Error('Submission not found');

      const country = (submission.countryCode || submission.country_code || 'ae').toLowerCase();
      const currency = submission.currency || 'USD';
      const expectedPrice = Number(submission.expectedPriceMinor || submission.expected_price_minor || 0);
      const propertyType = submission.propertyType || submission.property_type || 'apartment';
      const bedrooms = submission.bedrooms !== undefined ? submission.bedrooms : 0;
      const bathrooms = String(submission.bathrooms || '1');
      const sizeSqm = String(submission.sizeSqm || submission.size_sqm || '0');
      const sizeSqft = String(Math.round(Number(sizeSqm) * 10.7639));

      // Fetch exchange rates for price_usd_minor calculation
      const ratesRes = await tx.execute(sql`SELECT * FROM exchange_rates WHERE base = 'USD' LIMIT 1`);
      const ratesObj = (ratesRes.rows[0] as any)?.rates || {};
      const multiplier = ratesObj[currency] || 1.0;
      const priceUsdMinor = Math.round(expectedPrice / multiplier);

      const listingId = uuidv7();
      const rand = Math.floor(100 + Math.random() * 900);
      const refNumber = `WH-${country.toUpperCase()}-${rand}`;
      const title = `${propertyType.toUpperCase()} in ${submission.city}`;
      const slug = `property-${country}-${rand}`;

      // Get submission photos
      const docsRes = await tx.execute(
        sql`SELECT * FROM submission_documents WHERE submission_id = ${submission.id}::uuid`
      );
      const docs = docsRes.rows as any[];
      const coverImage = docs[0]?.file_url || docs[0]?.fileUrl || '/images/card-covers/dubai-marina-apartments.webp';

      const newListing: NewListingRow = {
        id: listingId,
        refNumber,
        slug,
        title,
        description: submission.description || `Luxury ${propertyType} submitted by homeowner.`,
        countryCode: country,
        city: submission.city,
        area: submission.area || null,
        propertyType,
        status: 'ready',
        reviewStatus: 'draft',
        priceMinor: expectedPrice,
        currency,
        priceUsdMinor,
        bedrooms,
        bathrooms,
        sizeSqm,
        sizeSqft,
        coverImage,
        isHotDeal: false,
        isFeatured: false,
        isVerified: true,
        isNewLaunch: false,
        isSample: false,
        floorPlans: [],
        agent: {
          name: 'Wild Hills Private Office',
          phone: '+971 50 680 2332',
          whatsapp: '+971506802332',
          email: 'walidward@gmail.com',
          avatarUrl: '/images/logo-icon.svg',
          license: '501-2026-200074238',
        },
        version: 1,
      };

      await tx.insert(listings).values(newListing);

      // Copy photos into listing_images
      for (let i = 0; i < docs.length; i++) {
        await tx.insert(listingImages).values({
          listingId,
          url: docs[i].file_url,
          alt: `${title} - Image ${i + 1}`,
          order: i,
        });
      }

      // Update submission status to converted_to_draft
      await tx
        .update(submissions)
        .set({ status: 'converted_to_draft', updatedAt: new Date() })
        .where(eq(submissions.id, submission.id));

      await this.recordAudit(
        actor,
        {
          action: 'admin.submission.convert',
          resourceType: 'submission',
          resourceId: submission.id,
          changes: { listingId, refNumber },
        },
        tx
      );

      return { listingId, refNumber, success: true };
    });
  }

  // ============================================================================
  // 4. LOCATIONS, DEVELOPERS, RATES, AUDIT LOG
  // ============================================================================

  async getLocations(country?: string): Promise<LocationRow[]> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      if (country) {
        const res = await tx.execute(
          sql`SELECT * FROM locations WHERE country_code = ${country.toLowerCase()} ORDER BY name ASC`
        );
        return res.rows as LocationRow[];
      }
      const res = await tx.execute(sql`SELECT * FROM locations ORDER BY country_code ASC, name ASC`);
      return res.rows as LocationRow[];
    });
  }

  async updateLocation(
    actor: Actor,
    id: string,
    updates: Partial<LocationRow>
  ): Promise<LocationRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const cleanUpdates: any = { ...updates, updatedAt: new Date() };
      delete cleanUpdates.id;

      await tx
        .update(locations)
        .set(cleanUpdates)
        .where(sql`id::text = ${id} OR slug = ${id}`);

      await this.recordAudit(
        actor,
        {
          action: 'admin.location.update',
          resourceType: 'location',
          resourceId: id,
          changes: updates,
        },
        tx
      );

      const res = await tx.execute(sql`SELECT * FROM locations WHERE id::text = ${id} OR slug = ${id} LIMIT 1`);
      return res.rows[0] as LocationRow;
    });
  }

  async getDevelopers(country?: string): Promise<DeveloperRow[]> {
    const db = getDatabase();
    return await withActor(db, { role: 'admin' }, async (tx) => {
      if (country) {
        const res = await tx.execute(
          sql`SELECT * FROM developers WHERE country_code = ${country.toLowerCase()} OR ${country.toLowerCase()} = ANY(operating_markets) ORDER BY name ASC`
        );
        return res.rows as DeveloperRow[];
      }
      const res = await tx.execute(sql`SELECT * FROM developers ORDER BY name ASC`);
      return res.rows as DeveloperRow[];
    });
  }

  async createDeveloper(actor: Actor, data: typeof developers.$inferInsert): Promise<DeveloperRow> {
    const db = getDatabase();
    const id = data.id || uuidv7();
    return await withActor(db, actor, async (tx) => {
      await tx.insert(developers).values({ ...data, id });

      await this.recordAudit(
        actor,
        {
          action: 'admin.developer.create',
          resourceType: 'developer',
          resourceId: id,
          changes: { name: data.name },
        },
        tx
      );

      const res = await tx.execute(sql`SELECT * FROM developers WHERE id = ${id}::uuid LIMIT 1`);
      return res.rows[0] as DeveloperRow;
    });
  }

  async updateDeveloper(
    actor: Actor,
    id: string,
    updates: Partial<DeveloperRow>
  ): Promise<DeveloperRow> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const cleanUpdates: any = { ...updates, updatedAt: new Date() };
      delete cleanUpdates.id;

      await tx
        .update(developers)
        .set(cleanUpdates)
        .where(sql`id::text = ${id} OR slug = ${id}`);

      await this.recordAudit(
        actor,
        {
          action: 'admin.developer.update',
          resourceType: 'developer',
          resourceId: id,
          changes: updates,
        },
        tx
      );

      const res = await tx.execute(sql`SELECT * FROM developers WHERE id::text = ${id} OR slug = ${id} LIMIT 1`);
      return res.rows[0] as DeveloperRow;
    });
  }

  async updateRates(
    actor: Actor,
    ratesData: Record<string, number>
  ): Promise<any> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      await tx
        .insert(exchangeRates)
        .values({
          base: 'USD',
          rates: ratesData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: exchangeRates.base,
          set: {
            rates: ratesData,
            updatedAt: new Date(),
          },
        });

      await this.recordAudit(
        actor,
        {
          action: 'admin.rates.update',
          resourceType: 'system',
          resourceId: 'rates',
          changes: ratesData,
        },
        tx
      );

      const res = await tx.execute(sql`SELECT * FROM exchange_rates WHERE base = 'USD' LIMIT 1`);
      return res.rows[0];
    });
  }

  async getAuditLogs(
    actor: Actor,
    filters: { resourceType?: string; resourceId?: string; action?: string; limit?: number; page?: number } = {}
  ): Promise<AuditLogRow[]> {
    const db = getDatabase();
    return await withActor(db, actor, async (tx) => {
      const limit = Math.min(100, Math.max(1, filters.limit || 50));
      const page = Math.max(1, filters.page || 1);
      const offset = (page - 1) * limit;

      const whereClauses: SQL[] = [];
      if (filters.resourceType) {
        whereClauses.push(sql`resource_type = ${filters.resourceType}`);
      }
      if (filters.resourceId) {
        whereClauses.push(sql`resource_id = ${filters.resourceId}`);
      }
      if (filters.action) {
        whereClauses.push(sql`action = ${filters.action}`);
      }

      const whereSql =
        whereClauses.length > 0
          ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
          : sql``;

      const res = await tx.execute(
        sql`SELECT * FROM audit_log ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      );

      return res.rows as AuditLogRow[];
    });
  }
}

export const adminRepository = new AdminRepository();

