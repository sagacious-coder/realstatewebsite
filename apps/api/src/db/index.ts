import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

const defaultDb = drizzle(pool, { schema });
let activeDb: any = defaultDb;

/**
 * Allows injecting an in-memory or mock database instance (e.g. PGlite in tests).
 */
export function setDatabase(customDb: any): void {
  activeDb = customDb;
}

/**
 * Active application database instance.
 * Transparently delegates to the active or default database provider.
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const target = activeDb || defaultDb;
    const value = target[prop];
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  },
});

export type AppDatabase = NodePgDatabase<typeof schema>;
export { schema };
