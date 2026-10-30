import { createApiClient, type ApiClient } from '@wild-hills/api-client';
import type {
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
  SearchQueryInput,
  SearchResult,
  SmartSearchSuggestionGroup,
  SubmissionCreate,
  SubmissionResponse,
  Testimonial,
} from '@wild-hills/contracts';

// Central singleton API client instance configured via API_MODE
export const apiClient: ApiClient = createApiClient();

// Data accessor helpers wrapping the typed API client
export async function getListings(query?: SearchQueryInput): Promise<SearchResult> {
  return apiClient.getListings(query);
}

export async function searchListings(query?: SearchQueryInput): Promise<SearchResult> {
  return apiClient.searchListings(query);
}

export async function getListingBySlug(slug: string): Promise<ListingDetail | null> {
  return apiClient.getListingBySlug(slug);
}

export async function getFeaturedListings(
  countryCode?: CountryCode,
  limit = 6
): Promise<ListingSummary[]> {
  return apiClient.getFeaturedListings(countryCode, limit);
}

export async function getLocations(countryCode?: CountryCode): Promise<Location[]> {
  return apiClient.getLocations(countryCode);
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  return apiClient.getLocationBySlug(slug);
}

export async function getFeaturedLocations(countryCode: CountryCode): Promise<Location[]> {
  return apiClient.getFeaturedLocations(countryCode);
}

export async function getDevelopers(countryCode?: CountryCode): Promise<Developer[]> {
  return apiClient.getDevelopers(countryCode);
}

export async function getDeveloper(id: string): Promise<Developer | null> {
  return apiClient.getDeveloper(id);
}

export async function getDeveloperBySlug(slug: string): Promise<Developer | null> {
  return apiClient.getDeveloperBySlug(slug);
}

export async function getProjects(countryCode?: CountryCode): Promise<Project[]> {
  return apiClient.getProjects(countryCode);
}

export async function getSearchSuggestions(
  query: string,
  countryCode?: CountryCode
): Promise<SmartSearchSuggestionGroup> {
  return apiClient.getSearchSuggestions(query, countryCode);
}

export async function getCountrySettings(countryCode: CountryCode): Promise<CountrySettings> {
  return apiClient.getCountrySettings(countryCode);
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  return apiClient.getExchangeRates();
}

export async function getBuyingGuide(countryCode: CountryCode): Promise<BuyingGuide | null> {
  return apiClient.getBuyingGuide(countryCode);
}

export async function getFaqs(countryCode?: CountryCode): Promise<FaqItem[]> {
  return apiClient.getFaqs(countryCode);
}

export async function getTestimonials(countryCode?: CountryCode): Promise<Testimonial[]> {
  return apiClient.getTestimonials(countryCode);
}

export async function getBlogPosts(countryCode?: CountryCode): Promise<BlogPost[]> {
  return apiClient.getBlogPosts(countryCode);
}

export async function createLead(data: LeadCreate): Promise<LeadResponse> {
  return apiClient.createLead(data);
}

export async function createSubmission(data: SubmissionCreate): Promise<SubmissionResponse> {
  return apiClient.createSubmission(data);
}

// Re-export types so UI components don't import from raw or internal fixtures
export type {
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
  SearchQueryInput,
  SearchResult,
  SmartSearchSuggestionGroup,
  SubmissionCreate,
  SubmissionResponse,
  Testimonial,
};

