-- Handshake MVP Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables.

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  field_data JSONB NOT NULL DEFAULT '{}',
  contract_text TEXT NOT NULL,
  signer_token TEXT UNIQUE NOT NULL,
  signer_email TEXT,
  signer_legal_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'otp_verified', 'signed', 'expired', 'superseded')),
  expires_at TIMESTAMPTZ NOT NULL,
  signed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES agreements(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP events table (hashed OTPs only)
CREATE TABLE IF NOT EXISTS otp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signature events table (immutable)
CREATE TABLE IF NOT EXISTS signature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_legal_name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  contract_text TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  canonical_payload TEXT NOT NULL,
  hmac_signature TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail table (append-only)
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'otp_sent', 'otp_verified', 'signed', 'expired', 'superseded')),
  actor_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agreements_creator ON agreements(creator_id);
CREATE INDEX IF NOT EXISTS idx_agreements_signer_token ON agreements(signer_token);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_otp_events_email_agreement ON otp_events(email, agreement_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_agreement ON signature_events(agreement_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_agreement ON audit_trail(agreement_id);

-- Row Level Security
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Creators can read their own agreements
CREATE POLICY "Creators can read own agreements"
  ON agreements FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert agreements"
  ON agreements FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Service role bypasses RLS for backend operations (signer access, signing, etc.)
-- The backend uses the service_role key which bypasses RLS automatically.

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
