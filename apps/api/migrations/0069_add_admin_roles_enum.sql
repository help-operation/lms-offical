-- Add new admin roles to user_role enum safely
-- Strategy: create new enum type, migrate columns, drop old type

DO $$ BEGIN
  CREATE TYPE "user_role_new" AS ENUM ('GUEST','STUDENT','INSTRUCTOR','SUPER_ADMIN','EDITOR','MARKETING_OFFICER','ACCOUNTANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_new" USING "role"::text::"user_role_new";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'GUEST';

ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "user_role_old";
