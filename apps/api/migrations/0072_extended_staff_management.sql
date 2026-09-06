-- Migration 0072: Extended staff management — payroll breakdown, bonus, addresses, child tables

-- ── New columns on users table ──────────────────────────────────────────────

-- Parent names
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_name varchar(200);

-- Present address hierarchy (separate from permanent)
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

-- ── Child tables ────────────────────────────────────────────────────────────

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
