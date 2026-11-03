import {
  SmartSearchSuggestionGroupSchema,
  type SmartSearchSuggestionGroup,
  type CountryCode,
} from '@wild-hills/contracts';
import { searchRepository } from '../repositories/search.repository.js';
import { locationsRepository } from '../repositories/locations.repository.js';
import { developersRepository } from '../repositories/developers.repository.js';

export interface PublicSuggestResult {
  query: string;
  locations: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    countryCode: string;
  }>;
  developers: Array<{
    id: string;
    name: string;
    slug: string;
    countryCode: string;
  }>;
  listings: Array<{
    id: string;
    refNumber: string;
    slug: string;
    title: string;
    countryCode: string;
  }>;
}

export class SearchService {
  async getSmartSuggestions(
    rawQuery: string,
    countryCode?: CountryCode
  ): Promise<SmartSearchSuggestionGroup> {
    const q = rawQuery.trim();
    if (!q) {
      return SmartSearchSuggestionGroupSchema.parse({
        query: rawQuery,
        cities: [],
        areas: [],
        projects: [],
        developers: [],
        references: [],
      });
    }

    const [suggestions, locCounts, devCounts] = await Promise.all([
      searchRepository.getSuggestions(q, countryCode),
      locationsRepository.getListingCountsByLocation(),
      developersRepository.getListingCountsByDeveloper(),
    ]);

    const cities = suggestions.locations
      .filter((l) => l.type === 'city')
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        countryCode: c.countryCode as CountryCode,
        count: locCounts.get(c.slug.toLowerCase()) ?? locCounts.get(c.name.toLowerCase()) ?? 0,
      }));

    const areas = suggestions.locations
      .filter((l) => l.type === 'area')
      .slice(0, 5)
      .map((a) => {
        // If parent location exists in suggestions
        const parent = suggestions.locations.find((p) => p.id === a.parentId);
        return {
          name: a.name,
          slug: a.slug,
          city: parent?.name || '',
          countryCode: a.countryCode as CountryCode,
          count: locCounts.get(a.slug.toLowerCase()) ?? locCounts.get(a.name.toLowerCase()) ?? 0,
        };
      });

    const projects = suggestions.projects.slice(0, 5).map((p) => ({
      name: p.name,
      slug: p.slug,
      developerName: p.developerName,
      countryCode: p.countryCode as CountryCode,
      count: 1,
    }));

    const developers = suggestions.developers.slice(0, 5).map((d) => ({
      name: d.name,
      slug: d.slug,
      countryCode: d.countryCode as CountryCode,
      count: devCounts.get(d.id) ?? 0,
    }));

    const references = suggestions.listings.slice(0, 5).map((l) => ({
      refNumber: l.refNumber,
      slug: l.slug,
      title: l.title,
    }));

    return SmartSearchSuggestionGroupSchema.parse({
      query: rawQuery,
      cities,
      areas,
      projects,
      developers,
      references,
    });
  }

  async getPublicSuggestions(
    rawQuery: string,
    countryCode?: CountryCode
  ): Promise<PublicSuggestResult> {
    const q = rawQuery.trim();
    if (!q) {
      return {
        query: rawQuery,
        locations: [],
        developers: [],
        listings: [],
      };
    }

    const suggestions = await searchRepository.getSuggestions(q, countryCode);

    return {
      query: rawQuery,
      locations: suggestions.locations.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        type: l.type,
        countryCode: l.countryCode,
      })),
      developers: suggestions.developers.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        countryCode: d.countryCode,
      })),
      listings: suggestions.listings.map((l) => ({
        id: l.id,
        refNumber: l.refNumber,
        slug: l.slug,
        title: l.title,
        countryCode: l.countryCode,
      })),
    };
  }
}

export const searchService = new SearchService();

