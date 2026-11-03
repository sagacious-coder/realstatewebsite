-- ==============================================================================
-- Migration 0005: Public Read Views for unauthenticated read-only traffic
-- ==============================================================================

-- 1. Public Locations View
CREATE OR REPLACE VIEW public_locations AS
SELECT
  id,
  slug,
  country_code,
  type,
  parent_id,
  name,
  tagline,
  description,
  image,
  banner_image,
  latitude,
  longitude,
  is_featured,
  featured_order,
  is_pinned,
  investment_score,
  avg_price_sqm,
  rental_yield_min,
  rental_yield_max,
  capital_appreciation,
  total_projects,
  created_at,
  updated_at,
  version
FROM locations;

-- 2. Public Developers View
CREATE OR REPLACE VIEW public_developers AS
SELECT
  id,
  slug,
  name,
  country_code,
  logo,
  description,
  founded_year,
  website,
  active_projects,
  escrow_certified,
  operating_markets,
  created_at,
  updated_at,
  version
FROM developers;

-- 3. Public Projects View
CREATE OR REPLACE VIEW public_projects AS
SELECT
  id,
  slug,
  name,
  developer_id,
  location_id,
  country_code,
  description,
  status,
  completion_year,
  starting_price_minor,
  currency,
  cover_image,
  created_at,
  updated_at,
  version
FROM projects;

-- 4. Public Listings View (strictly published listings only)
CREATE OR REPLACE VIEW public_listings AS
SELECT
  id,
  ref_number,
  slug,
  title,
  description,
  country_code,
  location_id,
  city,
  area,
  developer_id,
  project_id,
  property_type,
  status,
  review_status,
  price_minor,
  currency,
  price_usd_minor,
  bedrooms,
  bathrooms,
  size_sqm,
  size_sqft,
  cover_image,
  is_hot_deal,
  is_featured,
  is_verified,
  is_new_launch,
  is_sample,
  completion_year,
  furnishing_status,
  badges,
  features,
  video_url,
  virtual_tour_url,
  floor_plans,
  payment_plan,
  agent,
  latitude,
  longitude,
  created_at,
  updated_at,
  published_at,
  version
FROM listings
WHERE review_status = 'published';

-- 5. Public Listing Images View (images belonging to published listings)
CREATE OR REPLACE VIEW public_listing_images AS
SELECT
  li.id,
  li.listing_id,
  li.url,
  li.alt,
  li.caption,
  li.order,
  li.created_at
FROM listing_images li
JOIN listings l ON l.id = li.listing_id
WHERE l.review_status = 'published';

-- 6. Public Exchange Rates View
CREATE OR REPLACE VIEW public_rates AS
SELECT
  base,
  rates,
  updated_at
FROM exchange_rates;

-- 7. Grant SELECT to wh_public_ro, wh_api, wh_owner
GRANT SELECT ON public_locations TO wh_public_ro, wh_api, wh_owner;
GRANT SELECT ON public_developers TO wh_public_ro, wh_api, wh_owner;
GRANT SELECT ON public_projects TO wh_public_ro, wh_api, wh_owner;
GRANT SELECT ON public_listings TO wh_public_ro, wh_api, wh_owner;
GRANT SELECT ON public_listing_images TO wh_public_ro, wh_api, wh_owner;
GRANT SELECT ON public_rates TO wh_public_ro, wh_api, wh_owner;

