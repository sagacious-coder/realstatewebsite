import { sql, eq, or, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { withActor } from '../db/context.js';
import { publicProjects, type PublicProjectRow } from '../db/schema/views.js';

export class ProjectsRepository {
  async getProjects(countryCode?: string): Promise<PublicProjectRow[]> {
    return withActor(db, { role: 'public' }, async (tx) => {
      if (countryCode) {
        return tx
          .select()
          .from(publicProjects)
          .where(eq(publicProjects.countryCode, countryCode))
          .orderBy(asc(publicProjects.name));
      }

      return tx
        .select()
        .from(publicProjects)
        .orderBy(asc(publicProjects.name));
    });
  }

  async getProjectByIdOrSlug(idOrSlug: string): Promise<PublicProjectRow | null> {
    return withActor(db, { role: 'public' }, async (tx) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      if (isUuid) {
        const rows = await tx
          .select()
          .from(publicProjects)
          .where(or(eq(publicProjects.id, idOrSlug), eq(publicProjects.slug, idOrSlug)))
          .limit(1);
        return rows[0] || null;
      }

      const rows = await tx
        .select()
        .from(publicProjects)
        .where(eq(publicProjects.slug, idOrSlug))
        .limit(1);
      return rows[0] || null;
    });
  }
}

export const projectsRepository = new ProjectsRepository();

