import {
  ListingSummarySchema,
  ListingDetailSchema,
  SearchResultSchema,
  type ListingSummary,
  type ListingDetail,
  type SearchQuery,
  type SearchResult,
  toMinorUnits,
  normalizeToUsdMinor,
  type CurrencyCode,
} from '@wild-hills/contracts';
import {
  listingsRepository,
  type NormalizedSearchFilters,
  type ListingSortOption,
} from '../repositories/listings.repository.js';
import { ratesService } from './rates.service.js';
import type {
  PublicListingRow,
  PublicListingImageRow,
  PublicDeveloperRow,
  PublicProjectRow,
} from '../db/schema/views.js';

export class ListingsService {
  private async normalizeFilters(query: SearchQuery): Promise<{
    filters: NormalizedSearchFilters;
    sort: ListingSortOption;
    page: number;
    limit: number;
    offset: number;
  }> {
    const filters: NormalizedSearchFilters = {};

    if (query.q) filters.q = query.q;
    if (query.country) filters.country = query.country;
    if (query.city) filters.city = query.city;
    if (query.area) filters.area = query.area;

    if (query.type) {
      filters.types = Array.isArray(query.type) ? query.type : [query.type];
    }

    if (query.status) {
      filters.statuses = Array.isArray(query.status) ? query.status : [query.status];
    }

    // Convert price filters to USD minor units
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const exchangeRates = await ratesService.getExchangeRates();
      const rates = exchangeRates.rates as Record<CurrencyCode, number>;

      if (query.minPrice !== undefined) {
        filters.minUsdMinor = query.currency
          ? normalizeToUsdMinor(toMinorUnits(query.minPrice), query.currency, rates)
          : toMinorUnits(query.minPrice);
      }

      if (query.maxPrice !== undefined) {
        filters.maxUsdMinor = query.currency
          ? normalizeToUsdMinor(toMinorUnits(query.maxPrice), query.currency, rates)
          : toMinorUnits(query.maxPrice);
      }
    }

    // Parse bedrooms filter
    if (query.beds !== undefined) {
      if (typeof query.beds === 'number') {
        filters.exactBeds = query.beds;
      } else if (Array.isArray(query.beds)) {
        filters.beds = query.beds.map(Number);
      } else if (typeof query.beds === 'string') {
        const bedStr = query.beds.trim().toLowerCase();
        if (bedStr === 'studio') {
          filters.exactBeds = 0;
        } else if (bedStr.endsWith('+')) {
          const parsed = parseInt(bedStr.replace('+', ''), 10);
          if (!isNaN(parsed)) filters.minBeds = parsed;
        } else {
          const parsed = parseInt(bedStr, 10);
          if (!isNaN(parsed)) filters.exactBeds = parsed;
        }
      }
    }

    if (query.baths !== undefined) {
      filters.baths = query.baths;
    }

    if (query.minSize !== undefined) {
      filters.minSqm = query.sizeUnit === 'sqft' ? query.minSize * 0.092903 : query.minSize;
    }

    if (query.maxSize !== undefined) {
      filters.maxSqm = query.sizeUnit === 'sqft' ? query.maxSize * 0.092903 : query.maxSize;
    }

    if (query.handoverYear !== undefined) {
      filters.handoverYear = query.handoverYear;
    }

    if (query.features) {
      filters.features = Array.isArray(query.features) ? query.features : [query.features];
    }

    if (query.developer) filters.developer = query.developer;
    if (query.project) filters.project = query.project;

    if (query.isFeatured !== undefined) filters.isFeatured = query.isFeatured;
    if (query.isHotDeal) filters.isHotDeal = true;
    if (query.isNewLaunch) filters.isNewLaunch = true;
    if (query.isVerified) filters.isVerified = true;
    if (query.hasInstallments) filters.hasInstallments = true;

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 12, 1), 50);
    const offset = (page - 1) * limit;

    const sort = (query.sort || 'featured') as ListingSortOption;

    return { filters, sort, page, limit, offset };
  }

  private mapRowToSummary(
    raw: PublicListingRow,
    devMap: Map<string, { id: string; name: string; slug: string }>,
    projMap: Map<string, { id: string; name: string; slug: string }>
  ): ListingSummary {
    const row = raw as any;

    const developerId = row.developerId || row.developer_id;
    const projectId = row.projectId || row.project_id;
    const locationId = row.locationId || row.location_id || row.id;
    const countryCode = row.countryCode || row.country_code;
    const refNumber = row.refNumber || row.ref_number;
    const propertyType = row.propertyType || row.property_type;
    const priceMinor = Number(row.priceMinor ?? row.price_minor);
    const priceUsdMinor = Number(row.priceUsdMinor ?? row.price_usd_minor);
    const bathrooms = parseFloat(String(row.bathrooms));
    const sizeSqm = parseFloat(String(row.sizeSqm ?? row.size_sqm));
    const sizeSqft = parseFloat(String(row.sizeSqft ?? row.size_sqft));
    const coverImage = row.coverImage || row.cover_image;
    const isHotDeal = Boolean(row.isHotDeal ?? row.is_hot_deal);
    const isFeatured = Boolean(row.isFeatured ?? row.is_featured);
    const isVerified = Boolean(row.isVerified ?? row.is_verified);
    const isNewLaunch = Boolean(row.isNewLaunch ?? row.is_new_launch);
    const isSample = Boolean(row.isSample ?? row.is_sample);
    const completionYear = row.completionYear ?? row.completion_year ?? null;
    const furnishingStatus = row.furnishingStatus || row.furnishing_status || undefined;

    const dev = developerId ? devMap.get(developerId) : undefined;
    const proj = projectId ? projMap.get(projectId) : undefined;

    return ListingSummarySchema.parse({
      id: row.id,
      refNumber,
      slug: row.slug,
      title: row.title,
      propertyType,
      status: row.status,
      location: {
        id: locationId,
        countryCode,
        city: row.city,
        area: row.area || null,
      },
      developer: dev ? { id: dev.id, name: dev.name, slug: dev.slug } : null,
      project: proj ? { id: proj.id, name: proj.name, slug: proj.slug } : null,
      priceMinor,
      currency: row.currency,
      priceUsdMinor,
      bedrooms: Number(row.bedrooms),
      bathrooms,
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
    });
  }

  async searchListings(query: SearchQuery): Promise<SearchResult> {
    const { filters, sort, page, limit, offset } = await this.normalizeFilters(query);

    const [{ items, total }, facets] = await Promise.all([
      listingsRepository.searchListings(filters, sort, { offset, limit }),
      listingsRepository.getFacets(filters),
    ]);

    const devIds = items
      .map((i) => i.developerId || (i as any).developer_id)
      .filter(Boolean) as string[];
    const projIds = items
      .map((i) => i.projectId || (i as any).project_id)
      .filter(Boolean) as string[];

    const { developers, projects } = await listingsRepository.getEntityBriefs(devIds, projIds);

    const summaries = items.map((item) => this.mapRowToSummary(item, developers, projects));

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return SearchResultSchema.parse({
      items: summaries,
      total,
      page,
      limit,
      totalPages,
      hasMore,
      facetCounts: facets,
    });
  }

  async getListingDetail(refOrSlug: string): Promise<ListingDetail | null> {
    const data = await listingsRepository.getListingByRefOrSlug(refOrSlug);
    if (!data) return null;

    const { listing: rawListing, images, developer, project } = data;
    const listing = rawListing as any;

    const lat = listing.latitude ? parseFloat(String(listing.latitude)) : null;
    const lng = listing.longitude ? parseFloat(String(listing.longitude)) : null;

    const devBrief = developer
      ? { id: developer.id, name: developer.name, slug: developer.slug }
      : null;

    const projBrief = project
      ? { id: project.id, name: project.name, slug: project.slug }
      : null;

    const mappedImages = images.map((img: any) => ({
      url: img.url,
      alt: img.alt || listing.title,
      caption: img.caption || undefined,
      order: Number(img.order ?? 0),
    }));

    const coverImage = listing.coverImage || listing.cover_image;

    // If no secondary images found in listing_images, use coverImage as default
    if (mappedImages.length === 0 && coverImage) {
      mappedImages.push({
        url: coverImage,
        alt: listing.title,
        caption: undefined,
        order: 0,
      });
    }

    const publishedAt = listing.publishedAt || listing.published_at;
    const updatedAt = listing.updatedAt || listing.updated_at;

    const publishedAtIso = publishedAt instanceof Date ? publishedAt.toISOString() : new Date(publishedAt).toISOString();
    const updatedAtIso = updatedAt instanceof Date ? updatedAt.toISOString() : new Date(updatedAt).toISOString();

    return ListingDetailSchema.parse({
      id: listing.id,
      refNumber: listing.refNumber || listing.ref_number,
      slug: listing.slug,
      title: listing.title,
      description: listing.description || '',
      propertyType: listing.propertyType || listing.property_type,
      status: listing.status,
      location: {
        id: listing.locationId || listing.location_id || listing.id,
        countryCode: listing.countryCode || listing.country_code,
        city: listing.city,
        area: listing.area || null,
      },
      developer: devBrief,
      project: projBrief,
      priceMinor: Number(listing.priceMinor ?? listing.price_minor),
      currency: listing.currency,
      priceUsdMinor: Number(listing.priceUsdMinor ?? listing.price_usd_minor),
      bedrooms: Number(listing.bedrooms),
      bathrooms: parseFloat(String(listing.bathrooms)),
      sizeSqm: parseFloat(String(listing.sizeSqm ?? listing.size_sqm)),
      sizeSqft: parseFloat(String(listing.sizeSqft ?? listing.size_sqft)),
      coverImage,
      images: mappedImages,
      floorPlans: (listing.floorPlans || listing.floor_plans) || [],
      features: (listing.features) || [],
      videoUrl: listing.videoUrl || listing.video_url || null,
      virtualTourUrl: listing.virtualTourUrl || listing.virtual_tour_url || null,
      isHotDeal: Boolean(listing.isHotDeal ?? listing.is_hot_deal),
      isFeatured: Boolean(listing.isFeatured ?? listing.is_featured),
      isVerified: Boolean(listing.isVerified ?? listing.is_verified),
      isNewLaunch: Boolean(listing.isNewLaunch ?? listing.is_new_launch),
      isSample: Boolean(listing.isSample ?? listing.is_sample),
      completionYear: listing.completionYear ?? listing.completion_year ?? null,
      furnishingStatus: listing.furnishingStatus || listing.furnishing_status || undefined,
      badges: listing.badges || [],
      agent: listing.agent,
      paymentPlan: listing.paymentPlan || listing.payment_plan || null,
      coordinates: lat !== null && lng !== null ? { lat, lng } : null,
      publishedAt: publishedAtIso,
      updatedAt: updatedAtIso,
    });
  }
}

export const listingsService = new ListingsService();
