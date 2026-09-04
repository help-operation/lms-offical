DO $$ BEGIN
  ALTER TABLE "sms_templates" ADD COLUMN "template_type" varchar(20) NOT NULL DEFAULT 'sms';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;