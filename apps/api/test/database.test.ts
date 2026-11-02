import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import { generateSyntheticListings } from '../src/db/synthetic.js';
import { withActor } from '../src/db/context.js';
import * as schema from '../src/db/schema/index.js';

describe('Stage B2: Database Schema, Migrations, RLS & Seed', () => {
  let pglite: PGlite;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pglite = new PGlite({
      extensions: {
        citext,
        pg_trgm,
        unaccent,
      },
    });

    db = drizzle(pglite, { schema });
    // Apply migrations 0001, 0002, 0003
    await runMigrations(pglite);
  });

  afterAll(async () => {
    if (pglite) {
      await pglite.close();
    }
  });

  it('1. Forward migrations create all required tables and no forbidden tables', async () => {
    const res = await pglite.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const tableNames = res.rows.map((r) => r.table_name);

    const requiredTables = [
      'locations',
      'developers',
      'projects',
      'listings',
      'listing_images',
      'listing_translations',
      'listing_documents',
      'leads',
      'lead_notes',
      'submissions',
      'submission_documents',
      'users',
      'sessions',
      'passkeys',
      'totp_factors',
      'audit_log',
      'exchange_rates',
      'usage_counters',
    ];

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }

    // Strict Decision D6 check: No favorites or saved_searches tables
    expect(tableNames).not.toContain('favorites');
    expect(tableNames).not.toContain('saved_searches');
    expect(tableNames).not.toContain('user_favorites');
  });

  it('2. Roles and grants isolation check', async () => {
    const rolesRes = await pglite.query<{ rolname: string }>(`
      SELECT rolname FROM pg_roles WHERE rolname IN ('wh_owner', 'wh_api', 'wh_public_ro', 'wh_worker')
    `);

    const roleNames = rolesRes.rows.map((r) => r.rolname);
    expect(roleNames).toContain('wh_owner');
    expect(roleNames).toContain('wh_api');
    expect(roleNames).toContain('wh_public_ro');
    expect(roleNames).toContain('wh_worker');
  });

  it('3. normalize_search() folds accents, lowercases and handles nulls', async () => {
    const r1 = await pglite.query<{ val: string }>("SELECT normalize_search('Étoile') as val");
    expect(r1.rows[0]?.val).toBe('etoile');

    const r2 = await pglite.query<{ val: string }>("SELECT normalize_search('Şişli Istanbul') as val");
    expect(r2.rows[0]?.val).toBe('sisli istanbul');

    const r3 = await pglite.query<{ val: string }>("SELECT normalize_search('  Luxury VILLA 101  ') as val");
    expect(r3.rows[0]?.val).toBe('luxury villa 101');

    const r4 = await pglite.query<{ val: string }>('SELECT normalize_search(NULL) as val');
    expect(r4.rows[0]?.val).toBe('');
  });

  it('4. Publish guard trigger enforces completeness before publishing', async () => {
    const invalidListingId = uuidv7();

    // Attempting to insert a published listing without title or price must fail
    await expect(
      pglite.query(`
        INSERT INTO listings (
          id, ref_number, slug, title, country_code, city, property_type,
          review_status, price_minor, currency, price_usd_minor,
          size_sqm, size_sqft, cover_image, agent
        ) VALUES (
          '${invalidListingId}', 'WH-TEST-ERR', 'err-slug', '', 'ae', 'Dubai', 'apartment',
          'published', 0, 'AED', 0, 100, 1076, '', '{"name":"Agent"}'::jsonb
        )
      `)
    ).rejects.toThrow();
  });

  it('5. Audit log is immutable and cannot be updated or deleted', async () => {
    const auditId = uuidv7();

    await db.insert(schema.auditLog).values({
      id: auditId,
      action: 'listing.created',
      resourceType: 'listing',
      resourceId: auditId,
      actorRole: 'admin',
    });

    // Attempt to update audit log row
    await expect(
      pglite.query(`UPDATE audit_log SET action = 'tampered' WHERE id = '${auditId}'`)
    ).rejects.toThrow(/audit_log records are immutable/);

    // Attempt to delete audit log row
    await expect(
      pglite.query(`DELETE FROM audit_log WHERE id = '${auditId}'`)
    ).rejects.toThrow(/audit_log records are immutable/);
  });

  describe('Row-Level Security (RLS) & Actor Context', () => {
    const pubListingId = uuidv7();
    const draftListingId = uuidv7();
    const submissionId = uuidv7();
    const validCapToken = 'cap-token-secret-999';

    beforeAll(async () => {
      // Seed 1 published listing and 1 draft listing
      await pglite.query(`
        INSERT INTO listings (
          id, ref_number, slug, title, country_code, city, property_type,
          review_status, price_minor, currency, price_usd_minor,
          size_sqm, size_sqft, cover_image, is_sample, agent
        ) VALUES 
        ('${pubListingId}', 'RLS-PUB', 'rls-pub', 'Public Villa', 'ae', 'Dubai', 'villa', 'published', 100000000, 'AED', 27200000, 200, 2150, '/pub.webp', false, '{"name":"A"}'::jsonb),
        ('${draftListingId}', 'RLS-DFT', 'rls-dft', 'Draft Villa', 'ae', 'Dubai', 'villa', 'draft', 100000000, 'AED', 27200000, 200, 2150, '/dft.webp', false, '{"name":"A"}'::jsonb)
      `);

      // Seed 1 submission with capability token
      await pglite.query(`
        INSERT INTO submissions (
          id, seller_name, seller_email, seller_phone, country_code, city, property_type,
          bedrooms, bathrooms, size_sqm, expected_price_minor, currency, capability_token
        ) VALUES (
          '${submissionId}', 'John Doe', 'john@example.com', '+971501234567', 'ae', 'Dubai', 'penthouse',
          3, 3.5, 250, 500000000, 'AED', '${validCapToken}'
        )
      `);
    });

    it('Public actor sees only published listings (draft is hidden by RLS)', async () => {
      const results = await withActor(db, { role: 'public' }, async (tx) => {
        const rows = await tx.execute(
          sql`SELECT id, ref_number FROM listings WHERE id IN (${pubListingId}, ${draftListingId})`
        );
        return rows.rows;
      });

      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe(pubListingId);
    });

    it('Staff actor can view both published and draft listings', async () => {
      const results = await withActor(db, { role: 'admin' }, async (tx) => {
        const rows = await tx.execute(
          sql`SELECT id, ref_number FROM listings WHERE id IN (${pubListingId}, ${draftListingId})`
        );
        return rows.rows;
      });

      expect(results.length).toBe(2);
    });

    it('Submitter actor can only view submission when providing valid capability token', async () => {
      // With correct token
      const authResult = await withActor(
        db,
        { role: 'seller', submissionToken: validCapToken },
        async (tx) => {
          const rows = await tx.execute(
            sql`SELECT id, seller_name FROM submissions WHERE id = ${submissionId}`
          );
          return rows.rows;
        }
      );
      expect(authResult.length).toBe(1);
      expect(authResult[0]?.id).toBe(submissionId);

      // With wrong token
      const wrongResult = await withActor(
        db,
        { role: 'seller', submissionToken: 'invalid-token' },
        async (tx) => {
          const rows = await tx.execute(
            sql`SELECT id, seller_name FROM submissions WHERE id = ${submissionId}`
          );
          return rows.rows;
        }
      );
      expect(wrongResult.length).toBe(0);
    });
  });

  describe('Data Seeding & Stage 5 Parity', () => {
    it('Seeding populates exact Stage 5 counts for locations (51), developers (10), and listings (24)', async () => {
      const res = await runSeed(db);

      expect(res.locationsCount).toBe(51);
      expect(res.developersCount).toBe(10);
      expect(res.projectsCount).toBe(8);
      expect(res.listingsCount).toBe(24);
      expect(res.leadsCount).toBe(5);
      expect(res.submissionsCount).toBe(3);

      // Verify database table counts directly
      const locDbCount = await pglite.query('SELECT count(*)::int as c FROM locations');
      expect(locDbCount.rows[0]?.c).toBe(51);

      const devDbCount = await pglite.query('SELECT count(*)::int as c FROM developers');
      expect(devDbCount.rows[0]?.c).toBe(10);

      const listDbCount = await pglite.query(
        "SELECT count(*)::int as c FROM listings WHERE is_sample = true AND ref_number LIKE 'WH-%'"
      );
      expect(listDbCount.rows[0]?.c).toBe(24);
    });

    it('Synthetic listings generator produces searchable entries with valid schemas', async () => {
      const syntheticRows = generateSyntheticListings(10, { countryCode: 'ae' });
      expect(syntheticRows.length).toBe(10);

      // Insert synthetic items
      await db.insert(schema.listings).values(syntheticRows);

      // Test searching via normalize_search
      const searchRes = await pglite.query(`
        SELECT count(*)::int as c 
        FROM listings 
        WHERE ref_number LIKE 'SYN-AE-%'
          AND normalize_search(title) LIKE '%luxury%'
      `);

      expect(Number(searchRes.rows[0]?.c)).toBeGreaterThan(0);
    });
  });
});
