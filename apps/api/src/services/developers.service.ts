import {
  DeveloperSchema,
  type Developer,
  type CountryCode,
} from '@wild-hills/contracts';
import { developersRepository } from '../repositories/developers.repository.js';
import type { PublicDeveloperRow } from '../db/schema/views.js';

export class DevelopersService {
  private mapRowToDto(row: PublicDeveloperRow, listingCounts: Map<string, number>): Developer {
    const rawMarkets = row.operatingMarkets && row.operatingMarkets.length > 0
      ? row.operatingMarkets
      : [row.countryCode];
    const countryCodes = rawMarkets as CountryCode[];

    const activeListings = listingCounts.get(row.id) ?? 0;

    return DeveloperSchema.parse({
      id: row.id,
      slug: row.slug,
      name: row.name,
      logo: row.logo || '',
      countryCodes,
      websiteUrl: row.website && row.website.startsWith('http') ? row.website : null,
      description: row.description || '',
      projectCount: row.activeProjects ?? 0,
      activeListingCount: activeListings,
      isFeatured: row.escrowCertified ?? false,
    });
  }

  async getDevelopers(countryCode?: CountryCode): Promise<Developer[]> {
    const [rows, counts] = await Promise.all([
      developersRepository.getDevelopers(countryCode),
      developersRepository.getListingCountsByDeveloper(),
    ]);

    return rows.map((r) => this.mapRowToDto(r, counts));
  }

  async getDeveloper(idOrSlug: string): Promise<Developer | null> {
    const [row, counts] = await Promise.all([
      developersRepository.getDeveloperByIdOrSlug(idOrSlug),
      developersRepository.getListingCountsByDeveloper(),
    ]);

    if (!row) return null;
    return this.mapRowToDto(row, counts);
  }
}

export const developersService = new DevelopersService();
