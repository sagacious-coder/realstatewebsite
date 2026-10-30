import {
  BlogPost,
  BuyingGuide,
  CountryCode,
  CountrySettings,
  Developer,
  ExchangeRates,
  FaqItem,
  LeadCreate,
  LeadResponse,
  ListingDetail,
  ListingSummary,
  Location,
  Project,
  SearchQuery,
  SearchQueryInput,
  SearchResult,
  SmartSearchSuggestionGroup,
  SubmissionCreate,
  SubmissionResponse,
  Testimonial,
} from '@wild-hills/contracts';

export type ApiMode = 'mock' | 'live';

export interface ApiClientConfig {
  mode?: ApiMode;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface ApiClient {
  readonly mode: ApiMode;
  getListings(query?: SearchQueryInput): Promise<SearchResult>;
  searchListings(query?: SearchQueryInput): Promise<SearchResult>;
  getListingBySlug(slug: string): Promise<ListingDetail | null>;
  getFeaturedListings(countryCode?: CountryCode, limit?: number): Promise<ListingSummary[]>;
  getLocations(countryCode?: CountryCode): Promise<Location[]>;
  getLocationBySlug(slug: string): Promise<Location | null>;
  getFeaturedLocations(countryCode: CountryCode): Promise<Location[]>;
  getDevelopers(countryCode?: CountryCode): Promise<Developer[]>;
  getDeveloper(id: string): Promise<Developer | null>;
  getDeveloperBySlug(slug: string): Promise<Developer | null>;
  getProjects(countryCode?: CountryCode): Promise<Project[]>;
  getSearchSuggestions(query: string, countryCode?: CountryCode): Promise<SmartSearchSuggestionGroup>;
  getCountrySettings(countryCode: CountryCode): Promise<CountrySettings>;
  getExchangeRates(): Promise<ExchangeRates>;
  getBuyingGuide(countryCode: CountryCode): Promise<BuyingGuide | null>;
  getFaqs(countryCode?: CountryCode): Promise<FaqItem[]>;
  getTestimonials(countryCode?: CountryCode): Promise<Testimonial[]>;
  getBlogPosts(countryCode?: CountryCode): Promise<BlogPost[]>;
  createLead(data: LeadCreate): Promise<LeadResponse>;
  createSubmission(data: SubmissionCreate): Promise<SubmissionResponse>;
}

