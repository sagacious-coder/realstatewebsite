import {
  BlogPost,
  BuyingGuide,
  CountryCode,
  CountrySettings,
  Developer,
  ExchangeRates,
  FaqItem,
  LeadCreate,
  LeadCreateSchema,
  LeadRecord,
  LeadResponse,
  LeadResponseSchema,
  LeadStatus,
  ListingDetail,
  ListingDetailSchema,
  ListingSummary,
  Location,
  ProblemDetails,
  ProblemDetailsSchema,
  Project,
  SearchQuery,
  SearchQueryInput,
  SearchResult,
  SearchResultSchema,
  SmartSearchSuggestionGroup,
  SmartSearchSuggestionGroupSchema,
  SubmissionCreate,
  SubmissionCreateSchema,
  SubmissionRecord,
  SubmissionResponse,
  SubmissionResponseSchema,
  SubmissionStatus,
  UploadPresignRequest,
  UploadPresignRequestSchema,
  UploadPresignResponse,
  UploadPresignResponseSchema,
  Testimonial,
} from '@wild-hills/contracts';
import { ApiClient, ApiClientConfig, ApiMode } from './types.js';

export class ApiClientError extends Error {
  public readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || `API error (${problem.status})`);
    this.name = 'ApiClientError';
    this.problem = problem;
  }
}

export class LiveApiClient implements ApiClient {
  public readonly mode: ApiMode = 'live';
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = (config?.baseUrl || 'http://localhost:3002').replace(/\/$/, '');
    this.fetchFn = config?.fetchFn || globalThis.fetch.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    schema?: { parse: (val: unknown) => T }
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options?.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, application/problem+json');
    }
    if (options?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await this.fetchFn(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let problem: ProblemDetails;
      try {
        const body = await response.json();
        problem = ProblemDetailsSchema.parse(body);
      } catch {
        problem = {
          type: 'about:blank',
          title: response.statusText || 'HTTP Error',
          status: response.status,
          detail: `Request to ${endpoint} failed with HTTP ${response.status}`,
        };
      }
      throw new ApiClientError(problem);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    return schema ? schema.parse(data) : (data as T);
  }

  async getListings(query?: SearchQueryInput): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.set(key, String(value));
          }
        }
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/v1/listings${qs}`, { method: 'GET' }, SearchResultSchema);
  }

  async searchListings(query?: SearchQueryInput): Promise<SearchResult> {
    return this.getListings(query);
  }

  async getListingBySlug(slug: string): Promise<ListingDetail | null> {
    try {
      return await this.request(
        `/v1/listings/${encodeURIComponent(slug)}`,
        { method: 'GET' },
        ListingDetailSchema
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.problem.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getFeaturedListings(countryCode?: CountryCode, limit = 6): Promise<ListingSummary[]> {
    const res = await this.getListings({
      country: countryCode,
      isFeatured: true,
      limit,
    });
    return res.items;
  }

  async getLocations(countryCode?: CountryCode): Promise<Location[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/locations${qs}`, { method: 'GET' });
  }

  async getLocationBySlug(slug: string): Promise<Location | null> {
    try {
      return await this.request(`/v1/locations/${encodeURIComponent(slug)}`, { method: 'GET' });
    } catch {
      return null;
    }
  }

  async getFeaturedLocations(countryCode: CountryCode): Promise<Location[]> {
    const locations = await this.getLocations(countryCode);
    return locations.filter((loc) => loc.isFeatured);
  }

  async getDevelopers(countryCode?: CountryCode): Promise<Developer[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/developers${qs}`, { method: 'GET' });
  }

  async getDeveloper(id: string): Promise<Developer | null> {
    try {
      return await this.request(`/v1/developers/${encodeURIComponent(id)}`, { method: 'GET' });
    } catch {
      return null;
    }
  }

  async getDeveloperBySlug(slug: string): Promise<Developer | null> {
    return this.getDeveloper(slug);
  }

  async getProjects(countryCode?: CountryCode): Promise<Project[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/projects${qs}`, { method: 'GET' });
  }

  async getSearchSuggestions(
    query: string,
    countryCode?: CountryCode
  ): Promise<SmartSearchSuggestionGroup> {
    const params = new URLSearchParams({ q: query });
    if (countryCode) params.set('country', countryCode);
    return this.request(
      `/v1/search/suggestions?${params.toString()}`,
      { method: 'GET' },
      SmartSearchSuggestionGroupSchema
    );
  }

  async getCountrySettings(countryCode: CountryCode): Promise<CountrySettings> {
    return this.request(`/v1/content/country-settings/${encodeURIComponent(countryCode)}`, {
      method: 'GET',
    });
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    return this.request('/v1/content/rates', { method: 'GET' });
  }

  async getBuyingGuide(countryCode: CountryCode): Promise<BuyingGuide | null> {
    try {
      return await this.request(`/v1/content/buying-guide/${encodeURIComponent(countryCode)}`, {
        method: 'GET',
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.problem.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getFaqs(countryCode?: CountryCode): Promise<FaqItem[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/content/faqs${qs}`, { method: 'GET' });
  }

  async getTestimonials(countryCode?: CountryCode): Promise<Testimonial[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/content/testimonials${qs}`, { method: 'GET' });
  }

  async getBlogPosts(countryCode?: CountryCode): Promise<BlogPost[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    return this.request(`/v1/content/blog-posts${qs}`, { method: 'GET' });
  }

  async createLead(data: LeadCreate): Promise<LeadResponse> {
    const payload = LeadCreateSchema.parse(data);
    return this.request(
      '/v1/leads',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      LeadResponseSchema
    );
  }

  async createSubmission(data: SubmissionCreate): Promise<SubmissionResponse> {
    const payload = SubmissionCreateSchema.parse(data);
    return this.request(
      '/v1/submissions',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      SubmissionResponseSchema
    );
  }

  async presignUpload(data: UploadPresignRequest): Promise<UploadPresignResponse> {
    const payload = UploadPresignRequestSchema.parse(data);
    return this.request(
      '/v1/uploads/presign',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      UploadPresignResponseSchema
    );
  }

  async getLeads(countryCode?: CountryCode): Promise<LeadRecord[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    const res: any = await this.request(`/v1/admin/leads${qs}`, { method: 'GET' });
    return res?.items || res || [];
  }

  async getSubmissions(countryCode?: CountryCode): Promise<SubmissionRecord[]> {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
    const res: any = await this.request(`/v1/admin/submissions${qs}`, { method: 'GET' });
    return res?.items || res || [];
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, notes?: string): Promise<boolean> {
    await this.request(`/v1/admin/leads/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return true;
  }

  async updateSubmissionStatus(submissionId: string, status: SubmissionStatus): Promise<boolean> {
    await this.request(`/v1/admin/submissions/${encodeURIComponent(submissionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return true;
  }

  async getAdminListings(filters?: {
    country?: CountryCode;
    type?: string;
    status?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ListingSummary[]> {
    const params = new URLSearchParams();
    if (filters?.country) params.set('country', filters.country);
    if (filters?.type && filters.type !== 'all') params.set('propertyType', filters.type);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res: any = await this.request(`/v1/admin/listings${qs}`, { method: 'GET' });
    return res?.items || res || [];
  }

  async getAdminListingById(id: string): Promise<ListingDetail | null> {
    try {
      const res: any = await this.request(`/v1/admin/listings/${encodeURIComponent(id)}`, {
        method: 'GET',
      });
      return res?.listing || res || null;
    } catch (err) {
      if (err instanceof ApiClientError && err.problem.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async saveAdminListing(listing: ListingDetail): Promise<ListingDetail> {
    if (listing.id) {
      try {
        const existing = await this.getAdminListingById(listing.id);
        if (existing) {
          const res: any = await this.request(`/v1/admin/listings/${encodeURIComponent(listing.id)}`, {
            method: 'PUT',
            body: JSON.stringify(listing),
          });
          return res?.listing || res;
        }
      } catch {
        // Fallback to create
      }
    }
    const res: any = await this.request('/v1/admin/listings', {
      method: 'POST',
      body: JSON.stringify(listing),
    });
    return res?.listing || res;
  }

  async deleteAdminListing(id: string): Promise<boolean> {
    await this.request(`/v1/admin/listings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  }

  async duplicateAdminListing(id: string): Promise<ListingDetail | null> {
    const res: any = await this.request(`/v1/admin/listings/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    });
    return res?.listing || res || null;
  }
}

