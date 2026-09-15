import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, desc } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { backupJobs } from 'src/db/schema';
import { UploadService } from '../upload/upload.service';
import { spawn } from 'child_process';

export interface BackupJobRow {
  id: number;
  type: string;
  format: string;
  status: string;
  tables: string[] | null;
  fileUrl: string | null;
  fileSize: number | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdBy: number | null;
  createdAt: Date | null;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly uploadService: UploadService,
  ) {}

  // ─── List backup history ─────────────────────────────────────────────────

  async listBackups(page = 1, limit = 20): Promise<{ data: BackupJobRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      this.db.select().from(backupJobs).orderBy(desc(backupJobs.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: backupJobs.id }).from(backupJobs),
    ]);
    return { data: data as BackupJobRow[], total: countResult.length };
  }

  // ─── Get single backup job ───────────────────────────────────────────────

  async getBackup(id: number): Promise<BackupJobRow | null> {
    const rows = await this.db.select().from(backupJobs).where(eq(backupJobs.id, id)).limit(1);
    return (rows[0] as BackupJobRow) ?? null;
  }

  // ─── List eligible tables with row counts ────────────────────────────────

  async listTables(): Promise<{ name: string; rowCount: number }[]> {
    const result = await this.db.execute<{
      table_name: string;
      row_count: string;
    }>(`
      SELECT
        schemaname || '.' || tablename AS table_name,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);
    return result.rows.map((r) => ({
      name: r.table_name,
      rowCount: parseInt(r.row_count ?? '0', 10),
    }));
  }

  // ─── Trigger full pg_dump backup ─────────────────────────────────────────

  async triggerFullBackup(adminId: number | null): Promise<BackupJobRow> {
    const [job] = await this.db.insert(backupJobs).values({
      type: 'full',
      format: 'sql',
      status: 'running',
      startedAt: new Date(),
      createdBy: adminId,
    }).returning();

    // Run async — don't await
    this.runFullDump(job.id).catch((err) => {
      this.logger.error(`Full backup job ${job.id} failed: ${err.message}`);
    });

    return job as BackupJobRow;
  }

  private async runFullDump(jobId: number): Promise<void> {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('DATABASE_URL not set');

      const url = new URL(databaseUrl);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const key = `backups/full/backup-full-${timestamp}.sql.gz`;

      // pg_dump → gzip buffer
      const sqlBuffer = await this.runPgDump(url);
      const gzBuffer = await this.gzipBuffer(sqlBuffer);

      // Upload to R2
      const publicUrl = await this.uploadToR2(key, gzBuffer, 'application/gzip');

      await this.db.update(backupJobs).set({
        status: 'completed',
        fileUrl: publicUrl,
        fileSize: gzBuffer.length,
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));

      this.logger.log(`Full backup ${jobId} completed: ${publicUrl} (${gzBuffer.length} bytes)`);
    } catch (err: any) {
      await this.db.update(backupJobs).set({
        status: 'failed',
        errorMessage: err.message ?? 'Unknown error',
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));
    }
  }

  private runPgDump(url: URL): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = [
        '--host', url.hostname,
        '--port', url.port || '5432',
        '--username', url.username,
        '--no-owner',
        '--no-privileges',
        '--format=custom',
        url.pathname.replace('/', ''),
      ];

      const env = { ...process.env, PGPASSWORD: url.password };
      const proc = spawn('pg_dump', args, { env, stdio: ['ignore', 'pipe', 'pipe'] });

      const chunks: Buffer[] = [];
      proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));

      let stderr = '';
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(chunks));
        else reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
      });

      proc.on('error', reject);
    });
  }

  private gzipBuffer(input: Buffer): Promise<Buffer> {
    const { createGzip } = require('zlib') as typeof import('zlib');
    return new Promise((resolve, reject) => {
      const gz = createGzip({ level: 6 });
      const chunks: Buffer[] = [];
      gz.on('data', (c: Buffer) => chunks.push(c));
      gz.on('end', () => resolve(Buffer.concat(chunks)));
      gz.on('error', reject);
      gz.end(input);
    });
  }

  // ─── Trigger selective JSON backup ───────────────────────────────────────

  async triggerSelectiveBackup(tables: string[], adminId: number | null): Promise<BackupJobRow> {
    if (!tables.length) throw new Error('At least one table is required');

    const [job] = await this.db.insert(backupJobs).values({
      type: 'selective',
      format: 'json',
      status: 'running',
      tables,
      startedAt: new Date(),
      createdBy: adminId,
    }).returning();

    this.runSelectiveExport(job.id, tables).catch((err) => {
      this.logger.error(`Selective backup job ${job.id} failed: ${err.message}`);
    });

    return job as BackupJobRow;
  }

  private async runSelectiveExport(jobId: number, tables: string[]): Promise<void> {
    try {
      const exportData: Record<string, unknown[]> = {};

      for (const table of tables) {
        try {
          const result = await this.db.execute(`SELECT * FROM ${table}`);
          exportData[table] = result.rows;
        } catch (err: any) {
          this.logger.warn(`Failed to export table ${table}: ${err.message}`);
          exportData[table] = [{ _error: err.message }];
        }
      }

      const jsonStr = JSON.stringify(exportData, null, 2);
      const jsonBuffer = Buffer.from(jsonStr, 'utf-8');
      const gzBuffer = await this.gzipBuffer(jsonBuffer);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const key = `backups/selective/backup-selective-${timestamp}.json.gz`;

      const publicUrl = await this.uploadToR2(key, gzBuffer, 'application/gzip');

      await this.db.update(backupJobs).set({
        status: 'completed',
        fileUrl: publicUrl,
        fileSize: gzBuffer.length,
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));

      this.logger.log(`Selective backup ${jobId} completed: ${publicUrl}`);
    } catch (err: any) {
      await this.db.update(backupJobs).set({
        status: 'failed',
        errorMessage: err.message ?? 'Unknown error',
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));
    }
  }

  // ─── Delete backup ───────────────────────────────────────────────────────

  async deleteBackup(id: number): Promise<void> {
    const job = await this.getBackup(id);
    if (!job) throw new Error('Backup job not found');

    // Delete from R2 if file exists
    if (job.fileUrl) {
      try {
        await this.uploadService.deleteMediaFile(job.fileUrl);
      } catch (err: any) {
        this.logger.warn(`Failed to delete R2 file: ${err.message}`);
      }
    }

    await this.db.delete(backupJobs).where(eq(backupJobs.id, id));
  }

  // ─── R2 upload helper ────────────────────────────────────────────────────

  private async uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
    // Direct upload using env vars (same fallback as UploadService)
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_URL;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      throw new Error('R2 storage not configured. Set R2_* env vars or configure in Admin → Settings → Configaction.');
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));

    return `${publicUrl}/${key}`;
  }
}
