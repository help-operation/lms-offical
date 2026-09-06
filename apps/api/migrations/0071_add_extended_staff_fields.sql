-- Migration 0071: Extended staff profile fields
-- Adds: nidType, emergencyContactRelationship, banking fields, address hierarchy

ALTER TABLE users ADD COLUMN IF NOT EXISTS nid_type varchar(20); -- nid, passport
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship varchar(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banking_type varchar(20); -- mobile_banking, bank_account
ALTER TABLE users ADD COLUMN IF NOT EXISTS banking_provider varchar(50); -- bKash, Nagad, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS division varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS thana varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS union_name varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_code varchar(10);
