-- ==============================================================================
-- Migration 0006: Leads, Submissions, Email Outbox, and Idempotency Records
-- ==============================================================================

-- 1. Idempotency Records Table
CREATE TABLE IF NOT EXISTS idempotency_records (
  key TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  response_body JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Transactional Email Outbox Table (Section 18.3 & Decision D12)
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY,
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'noreply@wildhills.com',
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  priority VARCHAR(2) NOT NULL DEFAULT 'P1', -- P1 (staff alerts), P2 (resets/invites), P3 (seller tracking), P4 (visitor confirmations)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, deferred, failed
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient outbox worker polling
CREATE INDEX IF NOT EXISTS idx_email_outbox_status_scheduled ON email_outbox (status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_outbox_priority ON email_outbox (priority);

-- 3. Least-Privilege Role Grants
GRANT ALL ON email_outbox, idempotency_records TO wh_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_outbox, idempotency_records TO wh_api;
GRANT SELECT, INSERT ON email_outbox, idempotency_records TO wh_public_ro;
GRANT SELECT, INSERT, UPDATE ON email_outbox, idempotency_records TO wh_worker;
