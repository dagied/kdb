-- ============================================================
-- Migration: extend resident table for full registration data
-- Run once against your kebele_management_system database
-- ============================================================
BEGIN;
-- Split full name into components (keep full_name as a generated column)
ALTER TABLE resident
ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS grandfather_name TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  -- denormalised for search speed
ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (
    marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')
  ),
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Ethiopian',
  ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS previous_kebele TEXT,
  ADD COLUMN IF NOT EXISTS proof_of_residence TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  -- Community verification fields
ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS verification_date DATE,
  ADD COLUMN IF NOT EXISTS verification_note TEXT,
  ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW();
-- Extend resident_contact to cover phone numbers
-- (your existing table may already have contact_type / contact_value — adjust if needed)
ALTER TABLE resident_contact
ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS contact_value TEXT;
-- Ensure household_role table has the standard roles
INSERT INTO household_role (role_name)
VALUES ('Head'),
  ('Spouse'),
  ('Son'),
  ('Daughter'),
  ('Father'),
  ('Mother'),
  ('Other Dependent') ON CONFLICT (role_name) DO NOTHING;
-- Ensure audit_log has the columns we write to
ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS target_table TEXT,
  ADD COLUMN IF NOT EXISTS target_id INTEGER,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
-- Indexes for common look-ups
CREATE INDEX IF NOT EXISTS idx_resident_household ON resident (household_id);
CREATE INDEX IF NOT EXISTS idx_resident_house ON resident (house_id);
CREATE INDEX IF NOT EXISTS idx_resident_full_name ON resident USING gin (to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_resident_national_id ON resident (national_id);
CREATE INDEX IF NOT EXISTS idx_resident_contact ON resident_contact (resident_id);
COMMIT;