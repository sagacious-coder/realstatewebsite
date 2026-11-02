-- ==============================================================================
-- Migration 0002: Core Schema, Foreign Keys & Indexes
-- ==============================================================================

-- 1. Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  country_code VARCHAR(2) NOT NULL,
  type TEXT NOT NULL,
  parent_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  image TEXT,
  banner_image TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  investment_score INTEGER,
  avg_price_sqm BIGINT,
  rental_yield_min NUMERIC(4, 2),
  rental_yield_max NUMERIC(4, 2),
  capital_appreciation NUMERIC(4, 2),
  total_projects INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country_code);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_featured ON locations(is_featured, featured_order);

-- 2. Developers
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  logo TEXT,
  description TEXT,
  founded_year INTEGER,
  website TEXT,
  active_projects INTEGER NOT NULL DEFAULT 0,
  escrow_certified BOOLEAN NOT NULL DEFAULT true,
  operating_markets TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_developers_country ON developers(country_code);

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  country_code VARCHAR(2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'under_construction',
  completion_year INTEGER,
  starting_price_minor BIGINT,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country_code);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);

-- 4. Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY,
  ref_number TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  country_code VARCHAR(2) NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  city TEXT NOT NULL,
  area TEXT,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  property_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  review_status TEXT NOT NULL DEFAULT 'published',
  price_minor BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  price_usd_minor BIGINT NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms NUMERIC(3, 1) NOT NULL DEFAULT 1,
  size_sqm NUMERIC(10, 2) NOT NULL,
  size_sqft NUMERIC(10, 2) NOT NULL,
  cover_image TEXT NOT NULL,
  is_hot_deal BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_new_launch BOOLEAN NOT NULL DEFAULT false,
  is_sample BOOLEAN NOT NULL DEFAULT true,
  completion_year INTEGER,
  furnishing_status TEXT,
  badges TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  virtual_tour_url TEXT,
  floor_plans JSONB NOT NULL DEFAULT '[]',
  payment_plan JSONB,
  agent JSONB NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_listings_country_type ON listings(country_code, property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price_usd ON listings(price_usd_minor);
CREATE INDEX IF NOT EXISTS idx_listings_review_status ON listings(review_status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, is_hot_deal);
CREATE INDEX IF NOT EXISTS idx_listings_trgm_title ON listings USING gin (normalize_search(title) gin_trgm_ops);

-- 5. Listing Images
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  caption TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id, "order");

-- 6. Listing Translations
CREATE TABLE IF NOT EXISTS listing_translations (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_listing_locale UNIQUE (listing_id, locale)
);

-- 7. Listing Documents
CREATE TABLE IF NOT EXISTS listing_documents (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  country_scopes TEXT[] NOT NULL DEFAULT '{}',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 9. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 10. Passkeys
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. TOTP Factors
CREATE TABLE IF NOT EXISTS totp_factors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'inquiry',
  status TEXT NOT NULL DEFAULT 'new',
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  property_ref TEXT,
  property_title TEXT,
  budget_min BIGINT,
  budget_max BIGINT,
  currency VARCHAR(3),
  message TEXT,
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  preferred_contact TEXT NOT NULL DEFAULT 'whatsapp',
  consent_given BOOLEAN NOT NULL DEFAULT true,
  utm_source TEXT,
  utm_campaign TEXT,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country_code);

-- 13. Lead Notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  seller_name TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  property_type TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3, 1) NOT NULL,
  size_sqm NUMERIC(10, 2) NOT NULL,
  expected_price_minor BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  capability_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 15. Submission Documents
CREATE TABLE IF NOT EXISTS submission_documents (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  actor_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- 17. Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  base VARCHAR(3) PRIMARY KEY DEFAULT 'USD',
  rates JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Usage Counters
CREATE TABLE IF NOT EXISTS usage_counters (
  date TEXT PRIMARY KEY,
  email_count INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Role Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO wh_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wh_api;
GRANT SELECT, INSERT ON submissions TO wh_public_ro;
GRANT SELECT, INSERT ON leads TO wh_public_ro;
GRANT SELECT ON locations, developers, projects, listings, listing_images, listing_translations, exchange_rates, listing_documents TO wh_public_ro;
GRANT SELECT, INSERT, UPDATE ON leads, submissions, audit_log, usage_counters, exchange_rates, listing_images TO wh_worker;
