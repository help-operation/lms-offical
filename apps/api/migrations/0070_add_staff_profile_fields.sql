-- Migration 0070: Add comprehensive staff profile fields to users table
-- Safe migration — all columns nullable, no data loss risk

-- Employment info
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type varchar(20); -- full_time, part_time, contractual

-- Personal info
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture varchar(500);

-- Emergency contact
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone varchar(20);

-- Salary & bank
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary numeric(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name varchar(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number varchar(50);

-- Addresses
ALTER TABLE users ADD COLUMN IF NOT EXISTS present_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permanent_address text;
