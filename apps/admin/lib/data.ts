import { createApiClient } from '@wild-hills/api-client';
import {
  FIXTURE_LISTINGS,
  FIXTURE_DEVELOPERS,
  FIXTURE_LOCATIONS,
  type ListingDetail,
  type ListingSummary,
  type Developer,
  type Location,
  type CountryCode,
  type SearchQueryInput,
  toListingSummary,
} from '@wild-hills/contracts';

export const apiClient = createApiClient();

// In-memory mutable listings store for live local admin updates in mock mode
let adminListingsStore: ListingDetail[] = [...FIXTURE_LISTINGS];

export async function getAdminListings(filters?: {
  country?: CountryCode;
  type?: string;
  status?: string;
  search?: string;
  sort?: string;
}): Promise<ListingSummary[]> {
  let list = [...adminListingsStore];

  if (filters?.country) {
    list = list.filter((l) => l.location.countryCode === filters.country);
  }

  if (filters?.type && filters.type !== 'all') {
    list = list.filter((l) => l.propertyType === filters.type);
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((l) => l.status === filters.status);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.refNumber.toLowerCase().includes(q) ||
        l.location.city.toLowerCase().includes(q) ||
        (l.location.area && l.location.area.toLowerCase().includes(q)) ||
        (l.developer?.name && l.developer.name.toLowerCase().includes(q))
    );
  }

  if (filters?.sort) {
    if (filters.sort === 'price_asc') {
      list.sort((a, b) => a.priceMinor - b.priceMinor);
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => b.priceMinor - a.priceMinor);
    } else if (filters.sort === 'ref') {
      list.sort((a, b) => a.refNumber.localeCompare(b.refNumber));
    } else {
      // newest default
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
  }

  return list.map(toListingSummary);
}

export async function getAdminListingById(idOrSlug: string): Promise<ListingDetail | null> {
  const normalized = idOrSlug.toLowerCase();
  const found = adminListingsStore.find(
    (l) =>
      l.id.toLowerCase() === normalized ||
      l.slug.toLowerCase() === normalized ||
      l.refNumber.toLowerCase() === normalized
  );
  return found ? { ...found } : null;
}

export async function saveAdminListing(listing: ListingDetail): Promise<ListingDetail> {
  const index = adminListingsStore.findIndex((l) => l.id === listing.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    // Update existing
    adminListingsStore[index] = {
      ...listing,
      updatedAt: now,
    };
    return adminListingsStore[index];
  } else {
    // Create new
    const newListing: ListingDetail = {
      ...listing,
      id: listing.id || `list-${listing.location.countryCode}-${Date.now().toString().slice(-4)}`,
      publishedAt: listing.publishedAt || now,
      updatedAt: now,
    };
    adminListingsStore.unshift(newListing);
    return newListing;
  }
}

export async function deleteAdminListing(id: string): Promise<boolean> {
  const initialLength = adminListingsStore.length;
  adminListingsStore = adminListingsStore.filter((l) => l.id !== id);
  return adminListingsStore.length < initialLength;
}

export async function duplicateAdminListing(id: string): Promise<ListingDetail | null> {
  const original = await getAdminListingById(id);
  if (!original) return null;

  const randCode = Math.floor(100 + Math.random() * 900);
  const newRef = `WH-${original.location.countryCode.toUpperCase()}-${randCode}`;
  const newId = `list-${original.location.countryCode}-${Date.now().toString().slice(-4)}`;

  const duplicate: ListingDetail = {
    ...original,
    id: newId,
    refNumber: newRef,
    slug: `${original.slug}-copy-${randCode}`,
    title: `${original.title} (Copy)`,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  adminListingsStore.unshift(duplicate);
  return duplicate;
}

export async function getAdminDevelopers(countryCode?: CountryCode): Promise<Developer[]> {
  return apiClient.getDevelopers(countryCode);
}

export async function getAdminLocations(countryCode?: CountryCode): Promise<Location[]> {
  return apiClient.getLocations(countryCode);
}

