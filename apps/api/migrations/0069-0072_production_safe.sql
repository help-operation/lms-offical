-- ============================================================
-- SAFE PRODUCTION MIGRATION: 0069–0072
-- ============================================================
-- This script applies migrations 0069–0072 to the production DB.
-- It is CONDITIONAL: skips steps already applied.
-- All operations are ADDITIVE — no data will be deleted.
--
-- PREREQUISITE: Back up your database before running this.
--   pg_dump -h localhost -U postgres -d lms > lms_backup_YYYYMMDD.sql
--
-- USAGE (from production server):
--   psql -h localhost -U postgres -d lms -f 0069-0072_production_safe.sql
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- MIGRATION 0069: Enum type update (NOT fully idempotent)
-- ────────────────────────────────────────────────────────────
-- This migration renames enum types. It is safe to run ONCE.
-- We guard it by checking if the new enum values already exist.

DO $$
BEGIN
  -- Check if EDITOR exists in the current user_role enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'EDITOR'
  ) THEN
    -- Step 1: Create new enum type with all values
    CREATE TYPE "user_role_new" AS ENUM (
      'GUEST','STUDENT','INSTRUCTOR','SUPER_ADMIN',
      'EDITOR','MARKETING_OFFICER','ACCOUNTANT'
    );

    -- Step 2: Migrate column to new type
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role"
      TYPE "user_role_new" USING "role"::text::"user_role_new";
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'GUEST';

    -- Step 3: Swap enum types
    ALTER TYPE "user_role" RENAME TO "user_role_old";
    ALTER TYPE "user_role_new" RENAME TO "user_role";
    DROP TYPE "user_role_old";

    RAISE NOTICE '0069: Enum user_role updated successfully';
  ELSE
    RAISE NOTICE '0069: Already applied — skipping';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- MIGRATION 0070: Staff profile fields (idempotent)
-- ────────────────────────────────────────────────────────────
-- All ADD COLUMN IF NOT EXISTS — safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture varchar(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permanent_address text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION 0071: Extended staff fields (idempotent)
-- ────────────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS nid_type varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banking_type varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banking_provider varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS division varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS thana varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS union_name varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_code varchar(10);


-- ────────────────────────────────────────────────────────────
-- MIGRATION 0072: Extended staff management (idempotent)
-- ────────────────────────────────────────────────────────────

-- Parent names
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_name varchar(200);

-- Present address hierarchy
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_division varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_district varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_thana varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_union varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_post_code varchar(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_country varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS same_as_permanent boolean DEFAULT false;

-- Payroll breakdown
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_rent numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_allowance numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS transport_allowance numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS other_allowance numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gross_salary numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS overtime_rate numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_deduction numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provident_fund numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS other_deduction numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS net_salary numeric(12, 2);

-- Bonus
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_type varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_calculation_type varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_amount numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_frequency varchar(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_eligibility varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_notes text;

-- Child tables
CREATE TABLE IF NOT EXISTS user_education (
  id            serial PRIMARY KEY,
  user_id       integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  degree        varchar(200),
  institution   varchar(300),
  subject       varchar(200),
  passing_year  integer,
  result        varchar(50),
  "order"       integer DEFAULT 0,
  created_at    timestamp DEFAULT NOW(),
  updated_at    timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_experience (
  id                serial PRIMARY KEY,
  user_id           integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company           varchar(300),
  designation       varchar(200),
  department        varchar(100),
  employment_type   varchar(30),
  start_date        timestamp,
  end_date          timestamp,
  currently_working boolean DEFAULT false,
  responsibilities  text,
  reference_notes   text,
  "order"           integer DEFAULT 0,
  created_at        timestamp DEFAULT NOW(),
  updated_at        timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skills (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name  varchar(200) NOT NULL,
  level       varchar(20) DEFAULT 'intermediate',
  "order"     integer DEFAULT 0,
  created_at  timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_documents (
  id              serial PRIMARY KEY,
  user_id         integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type   varchar(100),
  document_name   varchar(300),
  file_url        varchar(1000),
  upload_date     timestamp DEFAULT NOW(),
  expiry_date     timestamp,
  notes           text,
  status          varchar(20) DEFAULT 'active',
  created_at      timestamp DEFAULT NOW(),
  updated_at      timestamp DEFAULT NOW()
);


COMMIT;
