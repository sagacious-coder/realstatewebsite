import {
  LocationSchema,
  type Location,
  type CountryCode,
} from '@wild-hills/contracts';
import { locationsRepository } from '../repositories/locations.repository.js';
import type { PublicLocationRow } from '../db/schema/views.js';

export class LocationsService {
  private mapRowToDto(row: PublicLocationRow, listingCounts: Map<string, number>): Location {
    const lat = row.latitude ? parseFloat(String(row.latitude)) : null;
    const lng = row.longitude ? parseFloat(String(row.longitude)) : null;

    const count =
      listingCounts.get(row.slug.toLowerCase()) ??
      listingCounts.get(row.name.toLowerCase()) ??
      row.totalProjects ??
      0;

    return LocationSchema.parse({
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type as 'country' | 'region' | 'city' | 'area',
      countryCode: row.countryCode as CountryCode,
      parentId: row.parentId || null,
      isFeatured: Boolean(row.isFeatured),
      pinOrder: row.featuredOrder ?? null,
      coordinates: lat !== null && lng !== null ? { lat, lng } : null,
      listingCount: count,
      coverImage: row.image || row.bannerImage || null,
      description: row.description || null,
      tagLabel: row.tagline || null,
    });
  }

  async getLocations(countryCode?: CountryCode): Promise<Location[]> {
    const [rows, counts] = await Promise.all([
      locationsRepository.getLocations(countryCode),
      locationsRepository.getListingCountsByLocation(),
    ]);

    return rows.map((r) => this.mapRowToDto(r, counts));
  }

  async getLocationBySlug(slug: string): Promise<Location | null> {
    const [row, counts] = await Promise.all([
      locationsRepository.getLocationBySlug(slug),
      locationsRepository.getListingCountsByLocation(),
    ]);

    if (!row) return null;
    return this.mapRowToDto(row, counts);
  }

  async getFeaturedLocations(countryCode: CountryCode): Promise<Location[]> {
    const locations = await this.getLocations(countryCode);
    return locations.filter((loc) => loc.isFeatured);
  }
}

export const locationsService = new LocationsService();

