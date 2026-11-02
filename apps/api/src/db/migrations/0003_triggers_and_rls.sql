-- ==============================================================================
-- Migration 0003: Triggers, Constraints & Row-Level Security (RLS)
-- ==============================================================================

-- 1. Publish Guard Trigger on Listings
CREATE OR REPLACE FUNCTION trg_publish_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_status = 'published' THEN
    IF NEW.title IS NULL OR trim(NEW.title) = '' THEN
      RAISE EXCEPTION 'Cannot publish listing without a title';
    END IF;
    IF NEW.price_minor IS NULL OR NEW.price_minor <= 0 THEN
      RAISE EXCEPTION 'Cannot publish listing without a valid price';
    END IF;
    IF NEW.cover_image IS NULL OR trim(NEW.cover_image) = '' THEN
      RAISE EXCEPTION 'Cannot publish listing without a cover image';
    END IF;
    IF NEW.country_code IS NULL OR trim(NEW.country_code) = '' THEN
      RAISE EXCEPTION 'Cannot publish listing without a country code';
    END IF;
    IF NEW.city IS NULL OR trim(NEW.city) = '' THEN
      RAISE EXCEPTION 'Cannot publish listing without a city';
    END IF;
    IF NEW.published_at IS NULL THEN
      NEW.published_at = now();
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_listing_publish_guard ON listings;
CREATE TRIGGER check_listing_publish_guard
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION trg_publish_guard();

-- 2. Immutable Append-Only Trigger on Audit Log
CREATE OR REPLACE FUNCTION trg_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log records are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_audit_log_immutable ON audit_log;
CREATE TRIGGER enforce_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION trg_audit_log_immutable();

-- 3. Row-Level Security (RLS) Configuration with FORCE ROW LEVEL SECURITY

-- 3.1 Listings RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_public_read ON listings;
CREATE POLICY listings_public_read ON listings
  FOR SELECT
  USING (
    review_status = 'published'
    OR current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );

DROP POLICY IF EXISTS listings_staff_mutation ON listings;
CREATE POLICY listings_staff_mutation ON listings
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );

-- 3.2 Leads RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_public_insert ON leads;
CREATE POLICY leads_public_insert ON leads
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS leads_staff_access ON leads;
CREATE POLICY leads_staff_access ON leads
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent')
  );

-- 3.3 Lead Notes RLS
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_notes_staff_access ON lead_notes;
CREATE POLICY lead_notes_staff_access ON lead_notes
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent')
  );

-- 3.4 Listing Documents RLS
ALTER TABLE listing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_documents FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS docs_public_read ON listing_documents;
CREATE POLICY docs_public_read ON listing_documents
  FOR SELECT
  USING (
    is_private = false
    OR current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );

DROP POLICY IF EXISTS docs_staff_mutation ON listing_documents;
CREATE POLICY docs_staff_mutation ON listing_documents
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );

-- 3.5 Submissions RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submissions_public_insert ON submissions;
CREATE POLICY submissions_public_insert ON submissions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS submissions_token_read ON submissions;
CREATE POLICY submissions_token_read ON submissions
  FOR SELECT
  USING (
    (
      current_setting('app.current_submission_token', true) IS NOT NULL 
      AND current_setting('app.current_submission_token', true) <> ''
      AND capability_token = current_setting('app.current_submission_token', true)
    )
    OR current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );

DROP POLICY IF EXISTS submissions_staff_mutation ON submissions;
CREATE POLICY submissions_staff_mutation ON submissions
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) IN ('owner', 'admin', 'agent', 'editor')
  );
