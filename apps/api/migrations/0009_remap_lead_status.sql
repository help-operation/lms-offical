-- Custom SQL migration file, put your code below! --
-- Remap legacy lead statuses onto the new pending/complete workflow model.
-- Runs in its own migration (separate transaction from 0008's ADD VALUE) so the
-- new 'complete' enum value is safe to use here.
--   paid       -> pending  (guest paid but not yet fulfilled; the order carries the paid state)
--   converted  -> complete (already turned into a user)
--   cancelled  -> complete (closed)
UPDATE "leads" SET "status" = 'pending'  WHERE "status" = 'paid';--> statement-breakpoint
UPDATE "leads" SET "status" = 'complete' WHERE "status" IN ('converted', 'cancelled');