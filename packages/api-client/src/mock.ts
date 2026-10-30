import {
  BlogPost,
  BuyingGuide,
  CountryCode,
  CountrySettings,
  Developer,
  ExchangeRates,
  FaqItem,
  FIXTURE_BLOG_POSTS,
  FIXTURE_BUYING_GUIDES,
  FIXTURE_COUNTRY_SETTINGS,
  FIXTURE_DEVELOPERS,
  FIXTURE_EXCHANGE_RATES,
  FIXTURE_FAQS,
  FIXTURE_LISTINGS,
  FIXTURE_LOCATIONS,
  FIXTURE_PROJECTS,
  FIXTURE_TESTIMONIALS,
  fromMinorUnits,
  LeadCreate,
  LeadCreateSchema,
  LeadResponse,
  ListingDetail,
  ListingSummary,
  Location,
  normalizeToUsdMinor,
  Project,
  PropertyType,
  SearchQuery,
  SearchQueryInput,
  SearchQuerySchema,
  SearchResult,
  SmartSearchSuggestionGroup,
  SubmissionCreate,
  SubmissionCreateSchema,
  SubmissionResponse,
  Testimonial,
  toListingSummary,
  toMinorUnits,
} from '@wild-hills/contracts';
import { ApiClient, ApiMode } from './types.js';

function delay(ms = 15): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export class MockApiClient implements ApiClient {
  public readonly mode: ApiMode = 'mock';

  async getListings(rawQuery?: SearchQueryInput): Promise<SearchResult> {
    await delay();
    const query: SearchQuery = SearchQuerySchema.parse(rawQuery ?? {});

    let filtered = [...FIXTURE_LISTINGS];

    // Filter by country
    if (query.country) {
      filtered = filtered.filter((l) => l.location.countryCode === query.country);
    }

    // Filter by city
    if (query.city) {
      const qCity = normalizeSearchText(query.city);
      filtered = filtered.filter(
        (l) =>
          normalizeSearchText(l.location.city).includes(qCity) ||
          normalizeSearchText(l.location.city.replace(/\s+/g, '-')) === qCity ||
          l.location.id.toLowerCase() === query.city?.toLowerCase()
      );
    }

    // Filter by area
    if (query.area) {
      const qArea = normalizeSearchText(query.area);
      filtered = filtered.filter(
        (l) =>
          l.location.area &&
          (normalizeSearchText(l.location.area).includes(qArea) ||
            normalizeSearchText(l.location.area.replace(/\s+/g, '-')) === qArea ||
            l.location.id.toLowerCase() === query.area?.toLowerCase())
      );
    }

    // Filter by property type
    if (query.type) {
      const types: PropertyType[] = Array.isArray(query.type) ? query.type : [query.type];
      filtered = filtered.filter((l) => types.includes(l.propertyType));
    }

    // Filter by price range (using USD minor normalization)
    const rates = FIXTURE_EXCHANGE_RATES.rates;
    if (query.minPrice !== undefined) {
      const minUsdMinor = query.currency
        ? normalizeToUsdMinor(toMinorUnits(query.minPrice), query.currency, rates)
        : toMinorUnits(query.minPrice);
      filtered = filtered.filter((l) => l.priceUsdMinor >= minUsdMinor);
    }

    if (query.maxPrice !== undefined) {
      const maxUsdMinor = query.currency
        ? normalizeToUsdMinor(toMinorUnits(query.maxPrice), query.currency, rates)
        : toMinorUnits(query.maxPrice);
      filtered = filtered.filter((l) => l.priceUsdMinor <= maxUsdMinor);
    }

    // Filter by bedrooms
    if (query.beds !== undefined) {
      if (typeof query.beds === 'number') {
        filtered = filtered.filter((l) => l.bedrooms === query.beds);
      } else if (Array.isArray(query.beds)) {
        const bedArr = query.beds as number[];
        filtered = filtered.filter((l) => bedArr.includes(l.bedrooms));
      } else if (typeof query.beds === 'string') {
        const bedStr = query.beds.toLowerCase();
        if (bedStr === 'studio') {
          filtered = filtered.filter((l) => l.bedrooms === 0);
        } else if (bedStr.endsWith('+')) {
          const minBeds = parseInt(bedStr.replace('+', ''), 10);
          if (!isNaN(minBeds)) {
            filtered = filtered.filter((l) => l.bedrooms >= minBeds);
          }
        } else {
          const exactBeds = parseInt(bedStr, 10);
          if (!isNaN(exactBeds)) {
            filtered = filtered.filter((l) => l.bedrooms === exactBeds);
          }
        }
      }
    }

    // Filter by bathrooms
    if (query.baths !== undefined) {
      filtered = filtered.filter((l) => l.bathrooms >= query.baths!);
    }

    // Filter by size
    if (query.minSize !== undefined) {
      const minSqm = query.sizeUnit === 'sqft' ? query.minSize * 0.092903 : query.minSize;
      filtered = filtered.filter((l) => l.sizeSqm >= minSqm);
    }

    if (query.maxSize !== undefined) {
      const maxSqm = query.sizeUnit === 'sqft' ? query.maxSize * 0.092903 : query.maxSize;
      filtered = filtered.filter((l) => l.sizeSqm <= maxSqm);
    }

    // Filter by status
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      filtered = filtered.filter((l) => statuses.includes(l.status));
    }

    // Filter by handover year
    if (query.handoverYear !== undefined) {
      filtered = filtered.filter((l) => l.completionYear === query.handoverYear);
    }

    // Filter by flags
    if (query.isFeatured !== undefined) filtered = filtered.filter((l) => l.isFeatured === query.isFeatured);
    if (query.isHotDeal) filtered = filtered.filter((l) => l.isHotDeal);
    if (query.isNewLaunch) filtered = filtered.filter((l) => l.isNewLaunch);
    if (query.isVerified) filtered = filtered.filter((l) => l.isVerified);
    if (query.hasInstallments) filtered = filtered.filter((l) => Boolean(l.paymentPlan));

    // Filter by developer
    if (query.developer) {
      const qDev = normalizeSearchText(query.developer);
      filtered = filtered.filter(
        (l) =>
          l.developer?.id?.toLowerCase() === query.developer?.toLowerCase() ||
          l.developer?.slug?.toLowerCase() === query.developer?.toLowerCase() ||
          (l.developer?.name && normalizeSearchText(l.developer.name).includes(qDev))
      );
    }

    // Filter by project
    if (query.project) {
      const qProj = normalizeSearchText(query.project);
      filtered = filtered.filter(
        (l) =>
          l.project?.id?.toLowerCase() === query.project?.toLowerCase() ||
          l.project?.slug?.toLowerCase() === query.project?.toLowerCase() ||
          (l.project?.name && normalizeSearchText(l.project.name).includes(qProj))
      );
    }

    // Full-text search keyword query
    if (query.q) {
      const q = normalizeSearchText(query.q);
      filtered = filtered.filter((l) => {
        const haystack = normalizeSearchText(
          `${l.refNumber} ${l.title} ${l.description} ${l.location.city} ${l.location.area || ''} ${l.developer?.name || ''} ${l.project?.name || ''}`
        );
        return haystack.includes(q);
      });
    }

    // Sorting
    const sort = query.sort || 'featured';
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.priceUsdMinor - b.priceUsdMinor;
        case 'price_desc':
          return b.priceUsdMinor - a.priceUsdMinor;
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'beds_asc':
          return a.bedrooms - b.bedrooms;
        case 'beds_desc':
          return b.bedrooms - a.bedrooms;
        case 'size_desc':
          return b.sizeSqm - a.sizeSqm;
        case 'featured':
        default:
          if (a.isFeatured !== b.isFeatured) {
            return a.isFeatured ? -1 : 1;
          }
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    // Compute facets from filtered dataset
    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let minUsdMinor = Infinity;
    let maxUsdMinor = 0;

    for (const item of filtered) {
      byType[item.propertyType] = (byType[item.propertyType] || 0) + 1;
      byCity[item.location.city] = (byCity[item.location.city] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      if (item.priceUsdMinor < minUsdMinor) minUsdMinor = item.priceUsdMinor;
      if (item.priceUsdMinor > maxUsdMinor) maxUsdMinor = item.priceUsdMinor;
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIdx = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIdx, startIdx + limit);

    return {
      items: paginatedItems.map(toListingSummary),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      facetCounts: {
        byType,
        byCity,
        byStatus,
        priceRange:
          total > 0
            ? { minUsdMinor, maxUsdMinor }
            : { minUsdMinor: 0, maxUsdMinor: 0 },
      },
    };
  }

  async searchListings(query?: SearchQueryInput): Promise<SearchResult> {
    return this.getListings(query);
  }

  async getListingBySlug(slug: string): Promise<ListingDetail | null> {
    await delay();
    const normalized = slug.toLowerCase();
    const found = FIXTURE_LISTINGS.find(
      (l) =>
        l.slug.toLowerCase() === normalized ||
        l.refNumber.toLowerCase() === normalized ||
        normalized.endsWith(l.slug.toLowerCase()) ||
        normalized.includes(l.refNumber.toLowerCase())
    );
    return found || null;
  }

  async getFeaturedListings(countryCode?: CountryCode, limit = 6): Promise<ListingSummary[]> {
    await delay();
    let listings = FIXTURE_LISTINGS.filter((l) => l.isFeatured);
    if (countryCode) {
      listings = listings.filter((l) => l.location.countryCode === countryCode);
    }
    return listings.slice(0, limit).map(toListingSummary);
  }

  async getLocations(countryCode?: CountryCode): Promise<Location[]> {
    await delay();
    if (!countryCode) return FIXTURE_LOCATIONS;
    return FIXTURE_LOCATIONS.filter((loc) => loc.countryCode === countryCode);
  }

  async getLocationBySlug(slug: string): Promise<Location | null> {
    await delay();
    const normalized = slug.toLowerCase();
    const loc = FIXTURE_LOCATIONS.find(
      (l) => l.slug.toLowerCase() === normalized || l.id.toLowerCase() === normalized
    );
    return loc || null;
  }

  async getFeaturedLocations(countryCode: CountryCode): Promise<Location[]> {
    await delay();
    return FIXTURE_LOCATIONS.filter((loc) => loc.countryCode === countryCode && loc.isFeatured).sort(
      (a, b) => (a.pinOrder || 99) - (b.pinOrder || 99)
    );
  }

  async getDevelopers(countryCode?: CountryCode): Promise<Developer[]> {
    await delay();
    if (!countryCode) return FIXTURE_DEVELOPERS;
    return FIXTURE_DEVELOPERS.filter((d) => d.countryCodes.includes(countryCode));
  }

  async getDeveloper(id: string): Promise<Developer | null> {
    await delay();
    const normalized = id.toLowerCase();
    const dev = FIXTURE_DEVELOPERS.find(
      (d) => d.id.toLowerCase() === normalized || d.slug.toLowerCase() === normalized
    );
    return dev || null;
  }

  async getDeveloperBySlug(slug: string): Promise<Developer | null> {
    return this.getDeveloper(slug);
  }

  async getProjects(countryCode?: CountryCode): Promise<Project[]> {
    await delay();
    if (!countryCode) return FIXTURE_PROJECTS;
    return FIXTURE_PROJECTS.filter((p) => p.countryCode === countryCode);
  }

  async getSearchSuggestions(
    rawQuery: string,
    countryCode?: CountryCode
  ): Promise<SmartSearchSuggestionGroup> {
    await delay();
    const q = normalizeSearchText(rawQuery);
    if (!q) {
      return {
        query: rawQuery,
        cities: [],
        areas: [],
        projects: [],
        developers: [],
        references: [],
      };
    }

    let locations = FIXTURE_LOCATIONS;
    let projects = FIXTURE_PROJECTS;
    let developers = FIXTURE_DEVELOPERS;
    let listings = FIXTURE_LISTINGS;

    if (countryCode) {
      locations = locations.filter((l) => l.countryCode === countryCode);
      projects = projects.filter((p) => p.countryCode === countryCode);
      developers = developers.filter((d) => d.countryCodes.includes(countryCode));
      listings = listings.filter((l) => l.location.countryCode === countryCode);
    }

    const matchedCities = locations
      .filter((l) => l.type === 'city' && normalizeSearchText(l.name).includes(q))
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        countryCode: c.countryCode,
        count: c.listingCount,
      }));

    const matchedAreas = locations
      .filter((l) => l.type === 'area' && normalizeSearchText(l.name).includes(q))
      .slice(0, 5)
      .map((a) => {
        const parentCity = locations.find((p) => p.id === a.parentId)?.name || '';
        return {
          name: a.name,
          slug: a.slug,
          city: parentCity,
          countryCode: a.countryCode,
          count: a.listingCount,
        };
      });

    const matchedProjects = projects
      .filter((p) => normalizeSearchText(p.name).includes(q))
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        slug: p.slug,
        developerName: p.developerName,
        countryCode: p.countryCode,
        count: listings.filter((l) => l.project?.name === p.name).length || 1,
      }));

    const matchedDevelopers = developers
      .filter((d) => normalizeSearchText(d.name).includes(q))
      .slice(0, 5)
      .map((d) => ({
        name: d.name,
        slug: d.slug,
        countryCode: d.countryCodes[0] || 'ae',
        count: d.activeListingCount,
      }));

    const matchedReferences = listings
      .filter(
        (l) =>
          normalizeSearchText(l.refNumber).includes(q) ||
          normalizeSearchText(l.slug).includes(q)
      )
      .slice(0, 5)
      .map((l) => ({
        refNumber: l.refNumber,
        slug: l.slug,
        title: l.title,
      }));

    return {
      query: rawQuery,
      cities: matchedCities,
      areas: matchedAreas,
      projects: matchedProjects,
      developers: matchedDevelopers,
      references: matchedReferences,
    };
  }

  async getCountrySettings(countryCode: CountryCode): Promise<CountrySettings> {
    await delay();
    const settings = FIXTURE_COUNTRY_SETTINGS[countryCode];
    if (!settings) {
      throw new Error(`Country settings not found for: ${countryCode}`);
    }
    return settings;
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    await delay();
    return FIXTURE_EXCHANGE_RATES;
  }

  async getBuyingGuide(countryCode: CountryCode): Promise<BuyingGuide | null> {
    await delay();
    const found = FIXTURE_BUYING_GUIDES.find((g) => g.countryCode === countryCode);
    return found || null;
  }

  async getFaqs(countryCode?: CountryCode): Promise<FaqItem[]> {
    await delay();
    if (!countryCode) return FIXTURE_FAQS;
    return FIXTURE_FAQS.filter((f) => !f.countryCode || f.countryCode === countryCode);
  }

  async getTestimonials(countryCode?: CountryCode): Promise<Testimonial[]> {
    await delay();
    if (!countryCode) return FIXTURE_TESTIMONIALS;
    return FIXTURE_TESTIMONIALS.filter((t) => t.countryCode === countryCode);
  }

  async getBlogPosts(countryCode?: CountryCode): Promise<BlogPost[]> {
    await delay();
    if (!countryCode) return FIXTURE_BLOG_POSTS;
    return FIXTURE_BLOG_POSTS.filter((b) => !b.countryCode || b.countryCode === countryCode);
  }

  async createLead(data: LeadCreate): Promise<LeadResponse> {
    await delay();
    const parsed = LeadCreateSchema.parse(data);
    return {
      success: true,
      leadId: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      message: `Lead registered successfully for ${parsed.name}`,
    };
  }

  async createSubmission(data: SubmissionCreate): Promise<SubmissionResponse> {
    await delay();
    const parsed = SubmissionCreateSchema.parse(data);
    return {
      success: true,
      submissionId: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      message: `Property submission registered successfully for ${parsed.sellerName}`,
    };
  }
}

