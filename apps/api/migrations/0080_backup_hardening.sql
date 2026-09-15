-- 0080: Backup & Restore hardening — indexes + concurrency lock row

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at ON backup_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs (status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_category ON backup_jobs (category);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_import_status ON backup_jobs (import_status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_by ON backup_jobs (created_by);

-- Concurrency lock row (ID = 0) — used by BackupService for DB-backed locking
INSERT INTO backup_jobs (id, type, format, status)
VALUES (0, 'lock', 'lock', 'unlocked')
ON CONFLICT (id) DO NOTHING;
