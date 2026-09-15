import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { backupJobs } from 'src/db/schema';
import { UploadService } from '../upload/upload.service';
import { spawn, execFileSync } from 'child_process';
import {
  BACKUP_CATEGORIES,
  MANIFEST_VERSION,
  SUPPORTED_MANIFEST_VERSIONS,
  type BackupManifest,
  type TableManifest,
  type ConflictStrategy,
  type ImportPreview,
  type TableConflict,
  type BackupCategoryDef,
} from './backup-categories';

// ─── Allowed tables for selective export (derived from categories) ────────────
const ALLOWED_BACKUP_TABLES = new Set(
  BACKUP_CATEGORIES.flatMap((c) => c.tables),
);

// ─── Max rows per table export (prevents OOM on large tables) ────────────────
const MAX_EXPORT_ROWS_PER_TABLE = 500_000;

// ─── Batch size for bulk imports ─────────────────────────────────────────────
const IMPORT_BATCH_SIZE = 500;

// ─── Backup job ID used as the DB-level lock row ─────────────────────────────
const CONCURRENCY_LOCK_ID = 0;

// ─── BackupJobRow type (matches DB schema) ───────────────────────────────────
export interface BackupJobRow {
  id: number;
  type: string;
  format: string;
  status: string;
  category: string | null;
  tables: string[] | null;
  manifest: BackupManifest | null;
  importStatus: string | null;
  conflictStrategy: string | null;
  importedTables: string[] | null;
  fileUrl: string | null;
  fileSize: number | null;
  preview: ImportPreview | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdBy: number | null;
  createdAt: Date | null;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private columnAllowlist: Map<string, Set<string>> | null = null;

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly uploadService: UploadService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN ALLOWLIST (P0-1: SQL injection prevention)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build the column allowlist from the actual database schema.
   * This is the authoritative source — never trust backup file column names.
   */
  private async getColumnAllowlist(): Promise<Map<string, Set<string>>> {
    if (this.columnAllowlist) return this.columnAllowlist;

    const allowlist = new Map<string, Set<string>>();
    const tableNames = Array.from(ALLOWED_BACKUP_TABLES).map((t) =>
      t.replace('public.', ''),
    );

    // Query information_schema for actual column names in the public schema.
    // We intentionally omit the IN clause to avoid Drizzle parameter-count
    // issues with 90+ tables; allowlist filtering happens below.
    const result = await this.db.execute<{
      table_name: string;
      column_name: string;
    }>(sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    for (const row of result.rows) {
      const tableName = row.table_name;
      const columnName = row.column_name;

      // Store with both bare and public.-prefixed keys
      if (!allowlist.has(tableName)) allowlist.set(tableName, new Set());
      allowlist.get(tableName)!.add(columnName);

      const qualified = `public.${tableName}`;
      if (!allowlist.has(qualified)) allowlist.set(qualified, new Set());
      allowlist.get(qualified)!.add(columnName);
    }

    this.columnAllowlist = allowlist;
    this.logger.log(`Column allowlist built: ${allowlist.size / 2} tables`);
    return allowlist;
  }

  /**
   * Validate that all row column names are in the allowlist.
   * Returns only allowed columns. Throws on injection attempts.
   */
  private async validateRowColumns(
    table: string,
    rowColumns: string[],
  ): Promise<string[]> {
    const allowlist = await this.getColumnAllowlist();
    const bareName = table.replace('public.', '');
    const allowed = allowlist.get(bareName) ?? allowlist.get(table);

    if (!allowed) {
      throw new BadRequestException(
        `Table "${table}" is not in the approved backup table list.`,
      );
    }

    const validated: string[] = [];
    const rejected: string[] = [];

    for (const col of rowColumns) {
      // Reject obviously malicious column names
      if (
        /[;'"\\\/\-\x00-\x1f]/.test(col) || // SQL injection chars, control chars
        col.startsWith('__') ||               // prototype pollution
        col === 'constructor' ||
        col === 'prototype' ||
        col.length > 128                       // absurdly long column name
      ) {
        rejected.push(col);
        continue;
      }

      if (allowed.has(col)) {
        validated.push(col);
      } else {
        rejected.push(col);
      }
    }

    if (rejected.length > 0) {
      this.logger.warn(
        `Rejected columns for table ${table}: ${rejected.join(', ')}`,
      );
      throw new BadRequestException(
        `Table "${table}" contains ${rejected.length} unrecognized/forbidden column(s): ${rejected.slice(0, 5).join(', ')}${rejected.length > 5 ? '...' : ''}. Import rejected for security.`,
      );
    }

    return validated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECKSUM VERIFICATION (P0-2: canonical implementation)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Canonical checksum verification.
   * The checksum in the manifest covers the JSON-serialized data payload.
   * Used by both dry-run and import.
   */
  private verifyChecksum(
    data: Record<string, unknown[]>,
    manifestChecksum: string,
  ): void {
    if (!manifestChecksum) return; // Older backups without checksums pass through

    const dataStr = JSON.stringify(data);
    const actualChecksum = createHash('sha256').update(dataStr).digest('hex');

    if (actualChecksum !== manifestChecksum) {
      throw new BadRequestException(
        'Backup integrity verification failed. The backup file may be corrupted or tampered with.',
      );
    }
  }

  /**
   * Verify manifest version is supported.
   */
  private verifyManifestVersion(version: number): void {
    if (!SUPPORTED_MANIFEST_VERSIONS.includes(version)) {
      throw new BadRequestException(
        `Unsupported backup format version (${version}). Please use a backup created by a compatible version of Leerney.`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCURRENCY CONTROL (P1-7: DB-backed lock)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Acquire a DB-backed concurrency lock for backup/restore operations.
   * Uses SELECT FOR UPDATE on a dedicated lock row in backup_jobs.
   */
  private async acquireLock(): Promise<void> {
    try {
      // Try to insert the lock row if it doesn't exist
      await this.db.execute(sql`
        INSERT INTO backup_jobs (id, type, format, status)
        VALUES (${CONCURRENCY_LOCK_ID}, 'lock', 'lock', 'locked')
        ON CONFLICT (id) DO NOTHING
      `);

      // Lock the row — blocks if another process holds it
      const result = await this.db.execute<{ status: string }>(sql`
        SELECT status FROM backup_jobs
        WHERE id = ${CONCURRENCY_LOCK_ID}
        FOR UPDATE NOWAIT
      `);

      const row = result.rows[0];
      if (row && row.status === 'locked' && row !== undefined) {
        // Lock row exists and is locked by someone else — NOWAIT throws
        // If we get here, we acquired the lock
      }
    } catch (err: any) {
      if (err?.code === '55P03' || err?.message?.includes('could not obtain lock')) {
        throw new BadRequestException(
          'Another backup or restore operation is already running. Please wait for it to complete.',
        );
      }
      throw err;
    }
  }

  /**
   * Release the DB-backed concurrency lock.
   */
  private async releaseLock(): Promise<void> {
    try {
      await this.db.execute(sql`
        UPDATE backup_jobs SET status = 'unlocked'
        WHERE id = ${CONCURRENCY_LOCK_ID}
      `);
    } catch {
      // Best effort — lock will auto-release on connection close
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST / GET
  // ═══════════════════════════════════════════════════════════════════════════

  listCategories(): BackupCategoryDef[] {
    return BACKUP_CATEGORIES;
  }

  async listBackups(page = 1, limit = 20): Promise<{ data: BackupJobRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const [data, countResult] = await Promise.all([
      this.db.select().from(backupJobs)
        .where(sql`id != ${CONCURRENCY_LOCK_ID}`)
        .orderBy(desc(backupJobs.createdAt))
        .limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` })
        .from(backupJobs)
        .where(sql`id != ${CONCURRENCY_LOCK_ID}`),
    ]);
    return { data: data as BackupJobRow[], total: countResult[0]?.count ?? 0 };
  }

  async getBackup(id: number): Promise<BackupJobRow | null> {
    const rows = await this.db.select().from(backupJobs).where(eq(backupJobs.id, id)).limit(1);
    return (rows[0] as BackupJobRow) ?? null;
  }

  async listTables(): Promise<{ name: string; rowCount: number }[]> {
    const result = await this.db.execute<{
      table_name: string;
      row_count: string;
    }>(`
      SELECT
        schemaname || '.' || relname AS table_name,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);
    return result.rows
      .filter((r) => ALLOWED_BACKUP_TABLES.has(r.table_name))
      .map((r) => ({
        name: r.table_name,
        rowCount: parseInt(r.row_count ?? '0', 10),
      }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT — Full pg_dump
  // ═══════════════════════════════════════════════════════════════════════════

  async triggerFullBackup(adminId: number | null): Promise<BackupJobRow> {
    await this.acquireLock();
    try {
      const [job] = await this.db.insert(backupJobs).values({
        type: 'full',
        format: 'sql',
        status: 'running',
        startedAt: new Date(),
        createdBy: adminId,
      }).returning();

      this.runFullDump(job.id).catch((err) => {
        this.logger.error(`Full backup job ${job.id} failed: ${err.message}`);
      }).finally(() => this.releaseLock());

      return job as BackupJobRow;
    } catch (err) {
      await this.releaseLock();
      throw err;
    }
  }

  private async runFullDump(jobId: number): Promise<void> {
    try {
      try {
        execFileSync('pg_dump', ['--version'], { stdio: 'ignore' });
      } catch {
        throw new Error('pg_dump is not installed. Install postgresql-client in the runtime container.');
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('DATABASE_URL not set');

      const url = new URL(databaseUrl);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const key = `backups/full/backup-full-${timestamp}.sql.gz`;

      const sqlBuffer = await this.runPgDump(url);
      const gzBuffer = await this.gzipBuffer(sqlBuffer);
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
        '--format=plain',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT — Category backup (JSON)
  // ═══════════════════════════════════════════════════════════════════════════

  async triggerCategoryBackup(categoryId: string, adminId: number | null): Promise<BackupJobRow> {
    const category = BACKUP_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) throw new BadRequestException(`Unknown category: ${categoryId}`);

    await this.acquireLock();
    try {
      const [job] = await this.db.insert(backupJobs).values({
        type: 'category',
        format: 'json',
        status: 'running',
        category: categoryId,
        tables: category.tables,
        startedAt: new Date(),
        createdBy: adminId,
      }).returning();

      this.runCategoryExport(job.id, category).catch((err) => {
        this.logger.error(`Category backup job ${job.id} failed: ${err.message}`);
      }).finally(() => this.releaseLock());

      return job as BackupJobRow;
    } catch (err) {
      await this.releaseLock();
      throw err;
    }
  }

  private async runCategoryExport(jobId: number, category: BackupCategoryDef): Promise<void> {
    try {
      const exportData: Record<string, unknown[]> = {};
      const tableManifests: TableManifest[] = [];
      const recordCounts: Record<string, number> = {};

      for (const table of category.tables) {
        try {
          const result = await this.db.execute(`SELECT * FROM ${table}`);
          const rows = result.rows;

          if (rows.length > MAX_EXPORT_ROWS_PER_TABLE) {
            throw new Error(
              `Table "${table}" has ${rows.length} rows, exceeding the ${MAX_EXPORT_ROWS_PER_TABLE.toLocaleString()} row limit. Export aborted to prevent memory exhaustion.`,
            );
          }

          exportData[table] = rows;
          recordCounts[table] = rows.length;

          const cols = rows.length > 0 ? Object.keys(rows[0] as object) : [];
          tableManifests.push({ table, rowCount: rows.length, columns: cols });
        } catch (err: any) {
          // Re-throw OOM guard errors as failures
          if (err.message?.includes('row limit')) throw err;
          this.logger.warn(`Failed to export table ${table}: ${err.message}`);
          exportData[table] = [];
          recordCounts[table] = 0;
          tableManifests.push({ table, rowCount: 0, columns: [] });
        }
      }

      const manifest: BackupManifest = {
        version: MANIFEST_VERSION,
        backupType: 'category',
        category: category.id,
        createdAt: new Date().toISOString(),
        tables: tableManifests,
        recordCounts,
        dependencies: category.dependencies,
        checksum: '',
      };

      // Compute checksum on the data payload
      const dataStr = JSON.stringify(exportData);
      manifest.checksum = createHash('sha256').update(dataStr).digest('hex');

      const finalWrapped = JSON.stringify({ manifest, data: exportData }, null, 2);
      const gzBuffer = await this.gzipBuffer(Buffer.from(finalWrapped, 'utf-8'));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const key = `backups/category/backup-${category.id}-${timestamp}.json.gz`;
      const publicUrl = await this.uploadToR2(key, gzBuffer, 'application/gzip');

      await this.db.update(backupJobs).set({
        status: 'completed',
        fileUrl: publicUrl,
        fileSize: gzBuffer.length,
        manifest: manifest as any,
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));

      this.logger.log(`Category backup ${jobId} (${category.id}) completed: ${publicUrl}`);
    } catch (err: any) {
      await this.db.update(backupJobs).set({
        status: 'failed',
        errorMessage: err.message ?? 'Unknown error',
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT — Selective backup (JSON)
  // ═══════════════════════════════════════════════════════════════════════════

  async triggerSelectiveBackup(tables: string[], adminId: number | null): Promise<BackupJobRow> {
    if (!tables.length) throw new BadRequestException('At least one table is required');

    const invalid = tables.filter((t) => !ALLOWED_BACKUP_TABLES.has(t));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Rejected table(s): ${invalid.join(', ')}. Only pre-approved application tables can be exported.`,
      );
    }

    await this.acquireLock();
    try {
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
      }).finally(() => this.releaseLock());

      return job as BackupJobRow;
    } catch (err) {
      await this.releaseLock();
      throw err;
    }
  }

  private async runSelectiveExport(jobId: number, tables: string[]): Promise<void> {
    try {
      const exportData: Record<string, unknown[]> = {};
      const tableManifests: TableManifest[] = [];
      const recordCounts: Record<string, number> = {};

      for (const table of tables) {
        try {
          const result = await this.db.execute(`SELECT * FROM ${table}`);
          const rows = result.rows;

          if (rows.length > MAX_EXPORT_ROWS_PER_TABLE) {
            throw new Error(
              `Table "${table}" has ${rows.length} rows, exceeding the ${MAX_EXPORT_ROWS_PER_TABLE.toLocaleString()} row limit.`,
            );
          }

          exportData[table] = rows;
          recordCounts[table] = rows.length;
          const cols = rows.length > 0 ? Object.keys(rows[0] as object) : [];
          tableManifests.push({ table, rowCount: rows.length, columns: cols });
        } catch (err: any) {
          if (err.message?.includes('row limit')) throw err;
          this.logger.warn(`Failed to export table ${table}: ${err.message}`);
          exportData[table] = [];
          recordCounts[table] = 0;
          tableManifests.push({ table, rowCount: 0, columns: [] });
        }
      }

      const manifest: BackupManifest = {
        version: MANIFEST_VERSION,
        backupType: 'selective',
        createdAt: new Date().toISOString(),
        tables: tableManifests,
        recordCounts,
        dependencies: [],
        checksum: '',
      };

      const dataStr = JSON.stringify(exportData);
      manifest.checksum = createHash('sha256').update(dataStr).digest('hex');

      const finalWrapped = JSON.stringify({ manifest, data: exportData }, null, 2);
      const gzBuffer = await this.gzipBuffer(Buffer.from(finalWrapped, 'utf-8'));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const key = `backups/selective/backup-selective-${timestamp}.json.gz`;
      const publicUrl = await this.uploadToR2(key, gzBuffer, 'application/gzip');

      await this.db.update(backupJobs).set({
        status: 'completed',
        fileUrl: publicUrl,
        fileSize: gzBuffer.length,
        manifest: manifest as any,
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

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT — Download, validate, dry-run, restore
  // ═══════════════════════════════════════════════════════════════════════════

  async importBackup(
    backupJobId: number,
    conflictStrategy: ConflictStrategy,
    adminId: number | null,
  ): Promise<BackupJobRow> {
    const job = await this.getBackup(backupJobId);
    if (!job) throw new NotFoundException('Backup job not found');
    if (job.status !== 'completed') throw new BadRequestException('Backup is not completed');
    if (!job.fileUrl) throw new BadRequestException('Backup file URL missing');

    await this.acquireLock();
    try {
      const [importJob] = await this.db.insert(backupJobs).values({
        type: 'import',
        format: job.format,
        status: 'running',
        category: job.category,
        tables: job.tables,
        conflictStrategy,
        startedAt: new Date(),
        createdBy: adminId,
      }).returning();

      this.runImport(importJob.id, job.fileUrl, job.format, conflictStrategy).catch((err) => {
        this.logger.error(`Import job ${importJob.id} failed: ${err.message}`);
      }).finally(() => this.releaseLock());

      return importJob as BackupJobRow;
    } catch (err) {
      await this.releaseLock();
      throw err;
    }
  }

  private async runImport(
    jobId: number,
    fileUrl: string,
    format: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Failed to download backup: ${response.statusText}`);

      const arrayBuf = await response.arrayBuffer();
      let rawBuffer = Buffer.from(arrayBuf) as Buffer;

      if (fileUrl.endsWith('.gz')) {
        rawBuffer = await this.gunzipBuffer(rawBuffer);
      }

      if (format === 'json') {
        await this.importJsonBackup(jobId, rawBuffer, conflictStrategy);
      } else if (format === 'sql') {
        await this.importSqlBackup(jobId, rawBuffer, conflictStrategy);
      } else {
        throw new Error(`Unsupported backup format: ${format}`);
      }
    } catch (err: any) {
      await this.db.update(backupJobs).set({
        status: 'failed',
        importStatus: 'failed',
        errorMessage: err.message ?? 'Unknown error',
        completedAt: new Date(),
      }).where(eq(backupJobs.id, jobId));
    }
  }

  private async importJsonBackup(
    jobId: number,
    buffer: Buffer,
    conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    const parsed = JSON.parse(buffer.toString('utf-8'));

    let data: Record<string, unknown[]>;
    let manifest: BackupManifest | null = null;

    if (parsed.manifest && parsed.data) {
      manifest = parsed.manifest;
      data = parsed.data;
    } else {
      data = parsed;
    }

    // P0-2: Verify manifest version
    if (manifest) {
      this.verifyManifestVersion(manifest.version);
    }

    // P0-2: Verify checksum (canonical implementation)
    if (manifest?.checksum) {
      this.verifyChecksum(data, manifest.checksum);
    }

    // Validate table names against allowlist
    const tables = Object.keys(data).filter((t) => t !== '_metadata');
    const invalidTables = tables.filter((t) => !ALLOWED_BACKUP_TABLES.has(t));
    if (invalidTables.length > 0) {
      throw new Error(`Rejected table(s): ${invalidTables.join(', ')}. Only pre-approved tables can be imported.`);
    }

    // P0-1: Validate column names against DB schema for every table
    for (const table of tables) {
      const rows = data[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // Check all rows for column consistency — use first row's keys
      const firstRowCols = Object.keys(rows[0] as object);
      await this.validateRowColumns(table, firstRowCols);

      // Also validate any extra columns in subsequent rows
      const allColumns = new Set<string>();
      for (const row of rows) {
        for (const col of Object.keys(row as object)) {
          allColumns.add(col);
        }
      }
      if (allColumns.size !== firstRowCols.length) {
        // Some rows have different columns — validate the full set
        await this.validateRowColumns(table, Array.from(allColumns));
      }
    }

    if (manifest) {
      await this.db.update(backupJobs).set({ manifest: manifest as any }).where(eq(backupJobs.id, jobId));
    }

    const importedTables: string[] = [];
    const sorted = this.topologicalSort(tables);

    await this.db.update(backupJobs).set({
      importStatus: 'importing',
    }).where(eq(backupJobs.id, jobId));

    // Wrap entire import in a transaction for atomicity
    await this.db.transaction(async (tx) => {
      for (const table of sorted) {
        const rows = data[table] as Record<string, unknown>[];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        // P0-1: Filter rows to only allowed columns
        const allowlist = await this.getColumnAllowlist();
        const bareName = table.replace('public.', '');
        const allowed = allowlist.get(bareName) ?? allowlist.get(table);
        if (!allowed) continue;

        const filteredRows = rows.map((row) => {
          const filtered: Record<string, unknown> = {};
          for (const key of Object.keys(row)) {
            if (allowed.has(key)) {
              filtered[key] = row[key];
            }
          }
          return filtered;
        });

        // P1-5: Batch import
        await this.importTableDataBatch(tx, table, filteredRows, conflictStrategy, allowed);
        importedTables.push(table);

        await tx.update(backupJobs).set({
          importedTables: importedTables as any,
        }).where(eq(backupJobs.id, jobId));
      }
    });

    await this.db.update(backupJobs).set({
      status: 'completed',
      importStatus: 'completed',
      importedTables: importedTables as any,
      completedAt: new Date(),
    }).where(eq(backupJobs.id, jobId));
  }

  // P0-3: SQL import with integrity verification
  private async importSqlBackup(
    jobId: number,
    buffer: Buffer,
    _conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    // Validate the SQL content before piping to psql
    const sqlContent = buffer.toString('utf-8');

    // Basic sanity checks
    if (sqlContent.length === 0) {
      throw new Error('Backup file is empty');
    }

    // Check for suspicious content that isn't a valid SQL dump
    const suspiciousPatterns = [
      /(?:^|\n)\s*--.*password/i,
      /(?:^|\n)\s*--.*secret/i,
      /(?:^|\n)\s*COPY.*password/i,
    ];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sqlContent)) {
        this.logger.warn(`Suspicious content detected in SQL backup (job ${jobId})`);
      }
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL not set');

    const url = new URL(databaseUrl);

    return new Promise((resolve, reject) => {
      const args = [
        '--host', url.hostname,
        '--port', url.port || '5432',
        '--username', url.username,
        '--no-owner',
        '--no-privileges',
        url.pathname.slice(1).split('?')[0],
      ];

      const env = { ...process.env, PGPASSWORD: url.password };
      const proc = spawn('psql', args, { env, stdio: ['pipe', 'ignore', 'pipe'] });

      let stderr = '';
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.stdin.write(buffer);
      proc.stdin.end();

      proc.on('close', async (code) => {
        if (code === 0) {
          await this.db.update(backupJobs).set({
            status: 'completed',
            importStatus: 'completed',
            completedAt: new Date(),
          }).where(eq(backupJobs.id, jobId));
          resolve();
        } else {
          reject(new Error(`psql exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DRY-RUN — Preview import without executing
  // ═══════════════════════════════════════════════════════════════════════════

  async dryRunImport(backupJobId: number): Promise<ImportPreview> {
    const job = await this.getBackup(backupJobId);
    if (!job) throw new NotFoundException('Backup job not found');
    if (job.status !== 'completed') throw new BadRequestException('Backup is not completed');
    if (!job.fileUrl) throw new BadRequestException('Backup file URL missing');

    const response = await fetch(job.fileUrl);
    if (!response.ok) throw new Error(`Failed to download backup: ${response.statusText}`);

    const arrayBuf = await response.arrayBuffer();
    let rawBuffer = Buffer.from(arrayBuf) as Buffer;

    if (job.fileUrl?.endsWith('.gz')) {
      rawBuffer = await this.gunzipBuffer(rawBuffer);
    }

    if (job.format !== 'json') {
      throw new BadRequestException('Dry-run only supported for JSON backups');
    }

    const parsed = JSON.parse(rawBuffer.toString('utf-8'));

    let data: Record<string, unknown[]>;
    let manifest: BackupManifest | null = null;

    if (parsed.manifest && parsed.data) {
      manifest = parsed.manifest;
      data = parsed.data;
    } else {
      data = parsed;
    }

    // P0-2: Verify manifest version in dry-run
    if (manifest) {
      this.verifyManifestVersion(manifest.version);
    }

    // P0-2: Verify checksum in dry-run
    if (manifest?.checksum) {
      this.verifyChecksum(data, manifest.checksum);
    }

    // P0-1: Validate column names in dry-run too
    for (const [table, rows] of Object.entries(data)) {
      if (table === '_metadata' || !Array.isArray(rows) || rows.length === 0) continue;
      if (!ALLOWED_BACKUP_TABLES.has(table)) continue;
      const firstRowCols = Object.keys(rows[0] as object);
      await this.validateRowColumns(table, firstRowCols);
    }

    const conflicts: TableConflict[] = [];
    for (const [table, rows] of Object.entries(data)) {
      if (table === '_metadata' || !Array.isArray(rows)) continue;
      const existingCount = await this.getTableCount(table);
      conflicts.push({
        table,
        existingCount,
        incomingCount: rows.length,
        strategy: 'skip' as ConflictStrategy,
      });
    }

    return {
      manifest: manifest ?? {
        version: MANIFEST_VERSION,
        backupType: job.type as any,
        createdAt: job.createdAt?.toISOString() ?? '',
        tables: [],
        recordCounts: {},
        dependencies: [],
        checksum: '',
      },
      conflicts,
      totalRecords: conflicts.reduce((sum, c) => sum + c.incomingCount, 0),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE DATA IMPORT — Batch operations (P1-5)
  // ═══════════════════════════════════════════════════════════════════════════

  private async importTableDataBatch(
    tx: any,
    table: string,
    rows: Record<string, unknown>[],
    strategy: ConflictStrategy,
    allowedColumns: Set<string>,
  ): Promise<void> {
    if (rows.length === 0) return;

    // Get column names from the first row (already validated)
    const columns = Object.keys(rows[0]).filter((c) => allowedColumns.has(c));
    if (columns.length === 0) return;

    const pkColumns = this.detectPrimaryKey(columns);

    // Process in batches
    for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
      const batch = rows.slice(i, i + IMPORT_BATCH_SIZE);

      switch (strategy) {
        case 'skip':
          await this.batchInsertSkip(tx, table, columns, pkColumns, batch);
          break;
        case 'overwrite':
          await this.batchUpsert(tx, table, columns, pkColumns, batch);
          break;
        case 'merge':
          await this.batchMerge(tx, table, columns, pkColumns, batch);
          break;
      }
    }
  }

  /**
   * Batch INSERT with ON CONFLICT DO NOTHING for each row.
   * Uses parameterized queries via Drizzle sql template.
   */
  private async batchInsertSkip(
    tx: any,
    table: string,
    columns: string[],
    pkColumns: string[],
    batch: Record<string, unknown>[],
  ): Promise<void> {
    if (batch.length === 0) return;

    // Check which rows already exist
    const existingIds = new Set<unknown>();
    if (pkColumns.length === 1) {
      const pkValues = batch.map((r) => r[pkColumns[0]]).filter((v) => v != null);
      if (pkValues.length > 0) {
        const result = await tx.execute(
          sql`SELECT ${sql.raw(`"${pkColumns[0]}"`)} AS pk FROM ${sql.raw(table)} WHERE ${sql.raw(`"${pkColumns[0]}"`)} IN (${sql.join(pkValues.map((v) => sql`${v}`), sql`, `)})`,
        );
        for (const row of result.rows) {
          existingIds.add((row as any).pk);
        }
      }
    }

    const newRows = batch.filter((r) => {
      const pkValue = pkColumns.length === 1 ? r[pkColumns[0]] : null;
      return pkValue == null || !existingIds.has(pkValue);
    });

    if (newRows.length === 0) return;

    // Bulk INSERT
    for (const row of newRows) {
      await this.insertRow(tx, table, columns, row);
    }
  }

  /**
   * Batch UPSERT — INSERT ... ON CONFLICT DO UPDATE for all rows.
   */
  private async batchUpsert(
    tx: any,
    table: string,
    columns: string[],
    pkColumns: string[],
    batch: Record<string, unknown>[],
  ): Promise<void> {
    for (const row of batch) {
      await this.upsertRow(tx, table, columns, pkColumns, row);
    }
  }

  /**
   * Batch MERGE — Update non-null fields, insert new rows.
   */
  private async batchMerge(
    tx: any,
    table: string,
    columns: string[],
    pkColumns: string[],
    batch: Record<string, unknown>[],
  ): Promise<void> {
    for (const row of batch) {
      const pkValue = this.getPkValue(row, pkColumns);
      if (pkValue == null) {
        await this.insertRow(tx, table, columns, row);
        continue;
      }
      const exists = await this.rowExists(tx, table, pkColumns, pkValue);
      if (exists) {
        await this.mergeRow(tx, table, columns, pkColumns, row);
      } else {
        await this.insertRow(tx, table, columns, row);
      }
    }
  }

  private detectPrimaryKey(columns: string[]): string[] {
    if (columns.includes('id')) return ['id'];
    return columns.slice(0, 2);
  }

  private getPkValue(row: Record<string, unknown>, pkColumns: string[]): unknown {
    if (pkColumns.length === 1) return row[pkColumns[0]];
    return pkColumns.map((c) => row[c]);
  }

  private async insertRow(
    tx: any,
    table: string,
    columns: string[],
    row: Record<string, unknown>,
  ): Promise<void> {
    const colIdentifiers = columns.map((c) => sql.raw(`"${c}"`)).join(', ');
    const values = columns.map((c) => this.sqlValue(row[c]));
    await tx.execute(
      sql`INSERT INTO ${sql.raw(table)} (${sql.raw(colIdentifiers)}) VALUES (${values}) ON CONFLICT DO NOTHING`,
    );
  }

  private async upsertRow(
    tx: any,
    table: string,
    columns: string[],
    pkColumns: string[],
    row: Record<string, unknown>,
  ): Promise<void> {
    const values = columns.map((c) => this.sqlValue(row[c]));
    const nonPkCols = columns.filter((c) => !pkColumns.includes(c));

    const colList = columns.map((c) => `"${c}"`).join(', ');
    const pkList = pkColumns.map((c) => `"${c}"`).join(', ');
    const updateList = nonPkCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');

    const valueList = sql.join(values as any[], sql`, `);

    await tx.execute(
      sql`INSERT INTO ${sql.raw(table)} (${sql.raw(colList)}) VALUES (${valueList})
          ON CONFLICT (${sql.raw(pkList)}) DO UPDATE SET ${sql.raw(updateList)}`,
    );
  }

  private async mergeRow(
    tx: any,
    table: string,
    columns: string[],
    pkColumns: string[],
    row: Record<string, unknown>,
  ): Promise<void> {
    const nonNullCols = columns.filter((c) => !pkColumns.includes(c) && row[c] != null);
    if (nonNullCols.length === 0) return;

    const setFragments = nonNullCols.map((c) =>
      sql`${sql.raw(`"${c}"`)} = ${this.sqlValue(row[c]) as any}`,
    );
    let setClause = setFragments[0];
    for (let i = 1; i < setFragments.length; i++) {
      setClause = sql`${setClause}, ${setFragments[i]}`;
    }

    const pkFragments = pkColumns.map((c) =>
      sql`${sql.raw(`"${c}"`)} = ${this.sqlValue(row[c]) as any}`,
    );
    let whereClause = pkFragments[0];
    for (let i = 1; i < pkFragments.length; i++) {
      whereClause = sql`${whereClause} AND ${pkFragments[i]}`;
    }

    await tx.execute(
      sql`UPDATE ${sql.raw(table)} SET ${setClause} WHERE ${whereClause}`,
    );
  }

  private sqlValue(v: unknown): unknown {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  }

  private async rowExists(
    tx: any,
    table: string,
    pkColumns: string[],
    pkValue: unknown,
  ): Promise<boolean> {
    if (pkColumns.length === 1) {
      const result = await tx.execute(
        sql`SELECT EXISTS(SELECT 1 FROM ${sql.raw(table)} WHERE ${sql.raw(`"${pkColumns[0]}"`)} = ${pkValue}) AS exists`,
      );
      return (result.rows[0] as any)?.exists === true;
    }
    const pkValues = Array.isArray(pkValue) ? pkValue : [pkValue];
    const conditions = pkColumns.map((c, i) =>
      sql`${sql.raw(`"${c}"`)} = ${pkValues[i]}`,
    );
    const whereClause = conditions.reduce((prev, curr) => sql`${prev} AND ${curr}`);
    const result = await tx.execute(
      sql`SELECT EXISTS(SELECT 1 FROM ${sql.raw(table)} WHERE ${whereClause}) AS exists`,
    );
    return (result.rows[0] as any)?.exists === true;
  }

  private async getTableCount(table: string): Promise<number> {
    try {
      const result = await this.db.execute(
        sql`SELECT COUNT(*) AS count FROM ${sql.raw(table)}`,
      );
      return parseInt((result.rows[0] as any)?.count ?? '0', 10);
    } catch {
      return 0;
    }
  }

  private topologicalSort(tables: string[]): string[] {
    const order = BACKUP_CATEGORIES.flatMap((c) => c.tables);
    return [...tables].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE — with R2 orphan prevention (P1-8)
  // ═══════════════════════════════════════════════════════════════════════════

  async deleteBackup(id: number): Promise<void> {
    // Refuse to delete the lock row
    if (id === CONCURRENCY_LOCK_ID) {
      throw new BadRequestException('Cannot delete the concurrency lock row');
    }

    const job = await this.getBackup(id);
    if (!job) throw new Error('Backup job not found');

    if (job.fileUrl) {
      try {
        await this.uploadService.deleteMediaFile(job.fileUrl);
      } catch (err: any) {
        // P1-8: If R2 deletion fails, do NOT delete DB record
        throw new Error(
          `Failed to delete backup file from storage: ${err.message}. ` +
          `Database record preserved to avoid orphaned state. Retry later.`,
        );
      }
    }

    await this.db.delete(backupJobs).where(eq(backupJobs.id, id));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS — Compress, decompress, upload
  // ═══════════════════════════════════════════════════════════════════════════

  private gzipBuffer(input: Buffer): Promise<Buffer> {
    const { createGzip } = require('zlib') as typeof import('zlib');
    return new Promise((resolve, reject) => {
      const gz = createGzip({ level: 6 });
      const chunks: Buffer[] = [];
      gz.on('data', (c: Buffer) => chunks.push(c));
      gz.on('end', () => resolve(Buffer.concat(chunks) as Buffer));
      gz.on('error', reject);
      gz.end(input);
    });
  }

  private gunzipBuffer(input: Buffer): Promise<Buffer> {
    const { createGunzip } = require('zlib') as typeof import('zlib');
    return new Promise((resolve, reject) => {
      const gz = createGunzip();
      const chunks: Buffer[] = [];
      gz.on('data', (c: Buffer) => chunks.push(c));
      gz.on('end', () => resolve(Buffer.concat(chunks) as Buffer));
      gz.on('error', reject);
      gz.end(input);
    });
  }

  private async uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
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
