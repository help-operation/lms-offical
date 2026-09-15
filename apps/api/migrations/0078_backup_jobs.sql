-- 0078: Backup jobs table for Data Backup & Export feature

CREATE TABLE IF NOT EXISTS backup_jobs (
  id            serial PRIMARY KEY,
  type          varchar(20) NOT NULL,
  format        varchar(10) NOT NULL,
  status        varchar(20) NOT NULL DEFAULT 'pending',
  tables        jsonb,
  file_url      text,
  file_size     integer,
  error_message text,
  started_at    timestamp,
  completed_at  timestamp,
  created_by    integer,
  created_at    timestamp DEFAULT now()
);
