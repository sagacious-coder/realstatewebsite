import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const MIGRATION_FILES = [
  '0001_extensions_roles.sql',
  '0002_core_tables.sql',
  '0003_triggers_and_rls.sql',
  '0004_auth_tables.sql',
  '0005_public_views.sql',
  '0006_leads_worker.sql',
];

export async function runMigrations(clientOrPool: any) {
  const migrationsDir = join(__dirname, 'migrations');

  for (const filename of MIGRATION_FILES) {
    const filePath = join(migrationsDir, filename);
    const sqlContent = readFileSync(filePath, 'utf-8');

    if (typeof clientOrPool.exec === 'function') {
      // PGlite interface
      await clientOrPool.exec(sqlContent);
    } else if (typeof clientOrPool.query === 'function') {
      // Node-pg Client or Pool
      await clientOrPool.query(sqlContent);
    } else {
      throw new Error('Unsupported database client provided to runMigrations');
    }
  }
}

async function main() {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL for migrations...');
    await runMigrations(client);
    console.log('✅ Migrations 0001-0003 applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run CLI directly if invoked as main module
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main();
}

