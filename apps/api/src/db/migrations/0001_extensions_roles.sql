-- ==============================================================================
-- Migration 0001: Extensions, Roles, Grants & Search Function
-- ==============================================================================

-- 1. PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Least-Privilege Roles Creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wh_owner') THEN
    CREATE ROLE wh_owner WITH LOGIN SUPERUSER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wh_api') THEN
    CREATE ROLE wh_api WITH LOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wh_public_ro') THEN
    CREATE ROLE wh_public_ro WITH LOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wh_worker') THEN
    CREATE ROLE wh_worker WITH LOGIN;
  END IF;
END $$;

-- 3. Search Normalization Function (diacritics removal and case folding)
CREATE OR REPLACE FUNCTION normalize_search(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;
  RETURN lower(unaccent(trim(input_text)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

