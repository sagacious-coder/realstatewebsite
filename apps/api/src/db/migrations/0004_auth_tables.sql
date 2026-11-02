-- Wild Hills Database Migration: 0004_auth_tables
-- Extends auth schema with invitations, recovery codes, challenges, and session hardening

-- 1. Sessions hardening (idle tracking and step-up authentication)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS step_up_until TIMESTAMPTZ;

-- 2. Staff invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY,
  email CITEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  country_scopes TEXT[] NOT NULL DEFAULT '{}',
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- 3. Single-use emergency recovery codes
CREATE TABLE IF NOT EXISTS recovery_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON recovery_codes(user_id);

-- 4. Temporary WebAuthn FIDO2 challenges
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_exp ON webauthn_challenges(expires_at);

-- 5. Least-Privilege Grants
GRANT ALL ON invitations, recovery_codes, webauthn_challenges TO wh_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON invitations, recovery_codes, webauthn_challenges TO wh_api, wh_worker;

