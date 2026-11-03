import {
  adminRepository,
  type AdminListingFilters,
  type AdminLeadFilters,
} from '../repositories/admin.repository.js';
import type { Actor } from '../db/context.js';
import type { ListingRow, ListingImageRow, NewListingRow } from '../db/schema/listings.js';
import type { LeadRow, SubmissionRow } from '../db/schema/leads.js';
import type { DeveloperRow } from '../db/schema/developers.js';
import type { LocationRow } from '../db/schema/locations.js';
import { getStorageProvider } from '../providers/index.js';
import { env } from '../config/env.js';

/**
 * Formula Injection Guard: Neutralizes spreadsheet-sensitive characters (=, +, -, @, \t, \r)
 * per Permanent Engineering Rule 4 and OWASP CSV Injection guidelines.
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  let s = val instanceof Date ? val.toISOString() : String(val);

  // If cell starts with formula characters, prepend single quote
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }

  // Escape inner double quotes
  s = s.replace(/"/g, '""');

  // Wrap in double quotes if it contains commas, double quotes, or newlines
  if (/[",\r\n]/.test(s)) {
    return `"${s}"`;
  }

  return s;
}

export class AdminService {
  // ============================================================================
  // 1. LISTINGS
  // ============================================================================

  async getListings(actor: Actor, filters: AdminListingFilters) {
    const { items, total } = await adminRepository.getAdminListings(actor, filters);
    return {
      items: items.map((item) => this.mapListingRowToSummary(item)),
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  async getListingById(actor: Actor, id: string) {
    const { listing, images, auditHistory } = await adminRepository.getAdminListingById(actor, id);
    if (!listing) return null;

    return {
      listing: this.mapListingRowToDetail(listing, images),
      auditHistory,
    };
  }

  async createListing(
    actor: Actor,
    data: any,
    images: Array<{ url: string; alt?: string; order?: number }> = []
  ) {
    const created = await adminRepository.createListing(actor, data, images);
    const { images: imgRows } = await adminRepository.getAdminListingById(actor, created.id);
    return this.mapListingRowToDetail(created, imgRows);
  }

  async updateListing(
    actor: Actor,
    id: string,
    data: any,
    expectedVersion?: number,
    images?: Array<{ url: string; alt?: string; order?: number }>
  ) {
    const updated = await adminRepository.updateListing(actor, id, data, expectedVersion, images);
    const { images: imgRows } = await adminRepository.getAdminListingById(actor, updated.id);
    return this.mapListingRowToDetail(updated, imgRows);
  }

  async publishListing(actor: Actor, id: string) {
    const published = await adminRepository.publishListing(actor, id);
    const { images: imgRows } = await adminRepository.getAdminListingById(actor, published.id);
    return this.mapListingRowToDetail(published, imgRows);
  }

  async unpublishListing(actor: Actor, id: string) {
    const unpublished = await adminRepository.unpublishListing(actor, id);
    const { images: imgRows } = await adminRepository.getAdminListingById(actor, unpublished.id);
    return this.mapListingRowToDetail(unpublished, imgRows);
  }

  async duplicateListing(actor: Actor, id: string) {
    const duplicated = await adminRepository.duplicateListing(actor, id);
    const { images: imgRows } = await adminRepository.getAdminListingById(actor, duplicated.id);
    return this.mapListingRowToDetail(duplicated, imgRows);
  }

  async deleteListing(actor: Actor, id: string) {
    return await adminRepository.deleteListing(actor, id);
  }

  // ============================================================================
  // 2. LEADS CRM & FORMULA-SAFE CSV EXPORT
  // ============================================================================

  async getLeads(actor: Actor, filters: AdminLeadFilters) {
    return await adminRepository.getAdminLeads(actor, filters);
  }

  async getLeadById(actor: Actor, id: string) {
    return await adminRepository.getAdminLeadById(actor, id);
  }

  async updateLeadStatus(actor: Actor, id: string, newStatus: string) {
    return await adminRepository.updateLeadStatus(actor, id, newStatus);
  }

  async addLeadNote(actor: Actor, leadId: string, content: string) {
    return await adminRepository.addLeadNote(actor, leadId, content);
  }

  async exportLeadsCsv(actor: Actor, country?: string): Promise<string> {
    const rows = await adminRepository.getLeadsForExport(actor, country);

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Country',
      'Status',
      'Type',
      'Listing Ref',
      'Budget Min',
      'Budget Max',
      'Currency',
      'Preferred Contact',
      'Message',
      'Created At',
    ];

    const lines: string[] = [headers.join(',')];

    for (const lead of rows) {
      const line = [
        sanitizeCsvField(lead.id),
        sanitizeCsvField(lead.name),
        sanitizeCsvField(lead.email),
        sanitizeCsvField(lead.phone),
        sanitizeCsvField(lead.countryCode || (lead as any).country_code || ''),
        sanitizeCsvField(lead.status),
        sanitizeCsvField(lead.type),
        sanitizeCsvField(lead.propertyRef || (lead as any).property_ref || ''),
        sanitizeCsvField(lead.budgetMin ?? (lead as any).budget_min ?? ''),
        sanitizeCsvField(lead.budgetMax ?? (lead as any).budget_max ?? ''),
        sanitizeCsvField(lead.currency || ''),
        sanitizeCsvField(lead.preferredContact || (lead as any).preferred_contact || ''),
        sanitizeCsvField(lead.message || ''),
        sanitizeCsvField(
          lead.createdAt || (lead as any).created_at
            ? new Date(lead.createdAt || (lead as any).created_at).toISOString()
            : ''
        ),
      ].join(',');
      lines.push(line);
    }

    return lines.join('\r\n');
  }

  // ============================================================================
  // 3. SELLER SUBMISSIONS REVIEW QUEUE
  // ============================================================================

  async getSubmissions(
    actor: Actor,
    filters: { status?: string; country?: string; page?: number; limit?: number }
  ) {
    return await adminRepository.getAdminSubmissions(actor, filters);
  }

  async getSubmissionById(actor: Actor, id: string) {
    return await adminRepository.getAdminSubmissionById(actor, id);
  }

  async updateSubmissionStatus(actor: Actor, id: string, status: string) {
    return await adminRepository.updateSubmissionStatus(actor, id, status);
  }

  async convertSubmission(actor: Actor, id: string) {
    return await adminRepository.convertSubmissionToDraft(actor, id);
  }

  // ============================================================================
  // 4. LOCATIONS, DEVELOPERS, RATES, AUDIT LOG & STORAGE
  // ============================================================================

  async getLocations(country?: string) {
    return await adminRepository.getLocations(country);
  }

  async updateLocation(actor: Actor, id: string, updates: Partial<LocationRow>) {
    return await adminRepository.updateLocation(actor, id, updates);
  }

  async getDevelopers(country?: string) {
    return await adminRepository.getDevelopers(country);
  }

  async createDeveloper(actor: Actor, data: any) {
    return await adminRepository.createDeveloper(actor, data);
  }

  async updateDeveloper(actor: Actor, id: string, updates: Partial<DeveloperRow>) {
    return await adminRepository.updateDeveloper(actor, id, updates);
  }

  async updateRates(actor: Actor, ratesData: Record<string, number>) {
    return await adminRepository.updateRates(actor, ratesData);
  }

  async getAuditLogs(
    actor: Actor,
    filters: { resourceType?: string; resourceId?: string; action?: string; limit?: number; page?: number }
  ) {
    return await adminRepository.getAuditLogs(actor, filters);
  }

  async getPrivateDocumentSignedUrl(key: string, expiresInSeconds = 60): Promise<string> {
    const storage = getStorageProvider();
    if (typeof storage.getSignedDownloadUrl === 'function') {
      return await storage.getSignedDownloadUrl(env.S3_BUCKET_PRIVATE, key, expiresInSeconds);
    }
    return `${env.S3_ENDPOINT}/${env.S3_BUCKET_PRIVATE}/${key}?signed=true&expires=${expiresInSeconds}`;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapListingRowToSummary(row: any) {
    const refNumber = row.refNumber || row.ref_number;
    const countryCode = row.countryCode || row.country_code;
    const reviewStatus = row.reviewStatus || row.review_status || 'draft';
    const locationId = row.locationId || row.location_id;
    const developerId = row.developerId || row.developer_id;
    const projectId = row.projectId || row.project_id;
    const propertyType = row.propertyType || row.property_type;
    const priceMinor = Number(row.priceMinor || row.price_minor || 0);
    const priceUsdMinor = Number(row.priceUsdMinor || row.price_usd_minor || 0);
    const sizeSqm = Number(row.sizeSqm || row.size_sqm || 0);
    const sizeSqft = Number(row.sizeSqft || row.size_sqft || 0);
    const coverImage = row.coverImage || row.cover_image;
    const isHotDeal = Boolean(row.isHotDeal ?? row.is_hot_deal);
    const isFeatured = Boolean(row.isFeatured ?? row.is_featured);
    const isVerified = Boolean(row.isVerified ?? row.is_verified);
    const isNewLaunch = Boolean(row.isNewLaunch ?? row.is_new_launch);
    const isSample = Boolean(row.isSample ?? row.is_sample);
    const completionYear = row.completionYear || row.completion_year;
    const furnishingStatus = row.furnishingStatus || row.furnishing_status || undefined;
    const publishedAt = row.publishedAt || row.published_at;
    const updatedAt = row.updatedAt || row.updated_at;

    return {
      id: row.id,
      refNumber,
      slug: row.slug,
      title: row.title,
      countryCode,
      propertyType,
      status: row.status,
      reviewStatus,
      location: {
        id: locationId || row.id,
        countryCode,
        city: row.city,
        area: row.area || undefined,
      },
      developer: developerId ? { id: developerId, name: '' } : null,
      project: projectId ? { id: projectId, name: '' } : null,
      priceMinor,
      currency: row.currency,
      priceUsdMinor,
      bedrooms: row.bedrooms,
      bathrooms: Number(row.bathrooms),
      sizeSqm,
      sizeSqft,
      coverImage,
      isHotDeal,
      isFeatured,
      isVerified,
      isNewLaunch,
      isSample,
      completionYear,
      furnishingStatus,
      badges: row.badges || [],
      version: row.version,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  private mapListingRowToDetail(row: any, images: any[]) {
    const summary = this.mapListingRowToSummary(row);
    const floorPlans = row.floorPlans || row.floor_plans || [];
    const features = row.features || [];
    const videoUrl = row.videoUrl || row.video_url || null;
    const virtualTourUrl = row.virtualTourUrl || row.virtual_tour_url || null;
    const agent = row.agent || {
      name: 'Wild Hills Concierge',
      phone: '+971 4 321 0000',
      email: 'concierge@wildhills.com',
    };
    const lat = row.latitude ?? row.lat;
    const lng = row.longitude ?? row.lng;

    return {
      ...summary,
      description: row.description || '',
      images: images.map((img: any) => ({
        url: img.url || img.file_url,
        alt: img.alt || undefined,
        caption: img.caption || undefined,
        order: img.order !== undefined ? img.order : 0,
      })),
      floorPlans: typeof floorPlans === 'string' ? JSON.parse(floorPlans) : floorPlans,
      features: Array.isArray(features) ? features : [],
      videoUrl,
      virtualTourUrl,
      agent: typeof agent === 'string' ? JSON.parse(agent) : agent,
      paymentPlan: row.paymentPlan || row.payment_plan || null,
      coordinates: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
      version: row.version,
    };
  }
}

export const adminService = new AdminService();
