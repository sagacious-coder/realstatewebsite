import {
  ProjectSchema,
  type Project,
  type CountryCode,
  type PropertyStatus,
  type CurrencyCode,
} from '@wild-hills/contracts';
import { projectsRepository } from '../repositories/projects.repository.js';
import { developersRepository } from '../repositories/developers.repository.js';
import { locationsRepository } from '../repositories/locations.repository.js';
import type { PublicProjectRow } from '../db/schema/views.js';

export class ProjectsService {
  private async mapRowToDto(row: PublicProjectRow): Promise<Project> {
    const [dev, loc] = await Promise.all([
      row.developerId ? developersRepository.getDeveloperByIdOrSlug(row.developerId) : null,
      row.locationId ? locationsRepository.getLocationByIdOrSlug(row.locationId) : null,
    ]);

    const locationName = loc?.name || (row.countryCode ? row.countryCode.toUpperCase() : 'Prime Location');
    const developerName = dev?.name || 'Wild Hills Developer';

    return ProjectSchema.parse({
      id: row.id,
      slug: row.slug,
      name: row.name,
      developerId: row.developerId || row.id,
      developerName,
      locationId: row.locationId || row.id,
      locationName,
      countryCode: row.countryCode as CountryCode,
      description: row.description || '',
      heroImage: row.coverImage || '',
      images: row.coverImage ? [row.coverImage] : [],
      status: (row.status || 'under_construction') as PropertyStatus,
      handoverYear: row.completionYear ?? null,
      startingPriceMinor: Number(row.startingPriceMinor ?? 0),
      currency: (row.currency || 'USD') as CurrencyCode,
      paymentPlanSummary: null,
    });
  }

  async getProjects(countryCode?: CountryCode): Promise<Project[]> {
    const rows = await projectsRepository.getProjects(countryCode);
    return Promise.all(rows.map((r) => this.mapRowToDto(r)));
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const row = await projectsRepository.getProjectByIdOrSlug(slug);
    if (!row) return null;
    return this.mapRowToDto(row);
  }
}

export const projectsService = new ProjectsService();
