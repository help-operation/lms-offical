-- 0079: Backup & Restore Center — add import columns to backup_jobs

ALTER TABLE backup_jobs
  ADD COLUMN IF NOT EXISTS category        varchar(50),
  ADD COLUMN IF NOT EXISTS manifest        jsonb,
  ADD COLUMN IF NOT EXISTS import_status   varchar(20),
  ADD COLUMN IF NOT EXISTS conflict_strategy varchar(20),
  ADD COLUMN IF NOT EXISTS imported_tables jsonb,
  ADD COLUMN IF NOT EXISTS preview         jsonb;
