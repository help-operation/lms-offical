import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, desc, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { backupJobs } from 'src/db/schema';
import { UploadService } from '../upload/upload.service';
import { spawn, execFileSync } from 'child_process';
import {
  BACKUP_CATEGORIES,
  MANIFEST_VERSION,
  type BackupManifest,
  type TableManifest,
  type ConflictStrategy,
  type ImportPreview,
  type TableConflict,
  type BackupCategoryDef,
} from './backup-categories';

// ─── Allowed tables for selective export (derived from categories, not hardcoded) ─────
const ALLOWED_BACKUP_TABLES = new Set(
  BACKUP_CATEGORIES.flatMap((c) => c.tables),
);

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

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly uploadService: UploadService,
  ) {}

  // ─── List categories ──────────────────────────────────────────────────────

  listCategories(): BackupCategoryDef[] {
    return BACKUP_CATEGORIES;
  }

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
    return result.rows
      .filter((r) => ALLOWED_BACKUP_TABLES.has(r.table_name))
      .map((r) => ({
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

    this.runFullDump(job.id).catch((err) => {
      this.logger.error(`Full backup job ${job.id} failed: ${err.message}`);
    });

    return job as BackupJobRow;
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

  // ─── Trigger category backup ─────────────────────────────────────────────

  async triggerCategoryBackup(categoryId: string, adminId: number | null): Promise<BackupJobRow> {
    const category = BACKUP_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) throw new BadRequestException(`Unknown category: ${categoryId}`);

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
    });

    return job as BackupJobRow;
  }

  private async runCategoryExport(jobId: number, category: BackupCategoryDef): Promise<void> {
    try {
      const exportData: Record<string, unknown[]> = {};
      const tableManifests: TableManifest[] = [];
      const recordCounts: Record<string, number> = {};

      for (const table of category.tables) {
        try {
          const result = await this.db.execute(`SELECT * FROM ${table}`);
          exportData[table] = result.rows;
          recordCounts[table] = result.rows.length;

          const cols = result.rows.length > 0 ? Object.keys(result.rows[0] as object) : [];
          tableManifests.push({ table, rowCount: result.rows.length, columns: cols });
        } catch (err: any) {
          this.logger.warn(`Failed to export table ${table}: ${err.message}`);
          exportData[table] = [];
          recordCounts[table] = 0;
          tableManifests.push({ table, rowCount: 0, columns: [] });
        }
      }

      // Wrap data with manifest for self-describing backup files
      const wrapped = JSON.stringify({ manifest: { version: MANIFEST_VERSION, backupType: 'category', category: category.id, createdAt: '', tables: tableManifests, recordCounts, dependencies: category.dependencies, checksum: '' }, data: exportData }, null, 2);
      const checksum = createHash('sha256').update(wrapped).digest('hex');

      const manifest: BackupManifest = {
        version: MANIFEST_VERSION,
        backupType: 'category',
        category: category.id,
        createdAt: new Date().toISOString(),
        tables: tableManifests,
        recordCounts,
        dependencies: category.dependencies,
        checksum,
      };

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

  // ─── Trigger selective JSON backup ───────────────────────────────────────

  async triggerSelectiveBackup(tables: string[], adminId: number | null): Promise<BackupJobRow> {
    if (!tables.length) throw new BadRequestException('At least one table is required');

    const invalid = tables.filter((t) => !ALLOWED_BACKUP_TABLES.has(t));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Rejected table(s): ${invalid.join(', ')}. Only pre-approved application tables can be exported.`,
      );
    }

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
      const tableManifests: TableManifest[] = [];
      const recordCounts: Record<string, number> = {};

      for (const table of tables) {
        try {
          const result = await this.db.execute(`SELECT * FROM ${table}`);
          exportData[table] = result.rows;
          recordCounts[table] = result.rows.length;
          const cols = result.rows.length > 0 ? Object.keys(result.rows[0] as object) : [];
          tableManifests.push({ table, rowCount: result.rows.length, columns: cols });
        } catch (err: any) {
          this.logger.warn(`Failed to export table ${table}: ${err.message}`);
          exportData[table] = [];
          recordCounts[table] = 0;
          tableManifests.push({ table, rowCount: 0, columns: [] });
        }
      }

      // Wrap data with manifest for self-describing backup files
      const wrapped = JSON.stringify({ manifest: { version: MANIFEST_VERSION, backupType: 'selective', createdAt: '', tables: tableManifests, recordCounts, dependencies: [], checksum: '' }, data: exportData }, null, 2);
      const checksum = createHash('sha256').update(wrapped).digest('hex');

      const manifest: BackupManifest = {
        version: MANIFEST_VERSION,
        backupType: 'selective',
        createdAt: new Date().toISOString(),
        tables: tableManifests,
        recordCounts,
        dependencies: [],
        checksum,
      };

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

  // ─── Import: download, validate, dry-run, restore ────────────────────────

  async importBackup(
    backupJobId: number,
    conflictStrategy: ConflictStrategy,
    adminId: number | null,
  ): Promise<BackupJobRow> {
    const job = await this.getBackup(backupJobId);
    if (!job) throw new NotFoundException('Backup job not found');
    if (job.status !== 'completed') throw new BadRequestException('Backup is not completed');
    if (!job.fileUrl) throw new BadRequestException('Backup file URL missing');

    // Create import job
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
    });

    return importJob as BackupJobRow;
  }

  private async runImport(
    jobId: number,
    fileUrl: string,
    format: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    try {
      // Download backup file
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Failed to download backup: ${response.statusText}`);

      const arrayBuf = await response.arrayBuffer();
      let rawBuffer = Buffer.from(arrayBuf) as Buffer;

      // Decompress if gzipped
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

    // Support both manifest-wrapped and raw data formats
    let data: Record<string, unknown[]>;
    let manifest: BackupManifest | null = null;

    if (parsed.manifest && parsed.data) {
      manifest = parsed.manifest;
      data = parsed.data;
    } else {
      data = parsed;
    }

    // Verify checksum if manifest present
    if (manifest?.checksum) {
      const dataStr = JSON.stringify(data);
      const actualChecksum = createHash('sha256').update(dataStr).digest('hex');
      if (actualChecksum !== manifest.checksum) {
        throw new Error('Checksum mismatch — backup file may be corrupted');
      }
    }

    // Validate all table names against allowlist BEFORE importing
    const tables = Object.keys(data).filter((t) => t !== '_metadata');
    const invalidTables = tables.filter((t) => !ALLOWED_BACKUP_TABLES.has(t));
    if (invalidTables.length > 0) {
      throw new Error(`Rejected table(s): ${invalidTables.join(', ')}. Only pre-approved tables can be imported.`);
    }

    // Update manifest on job
    if (manifest) {
      await this.db.update(backupJobs).set({ manifest: manifest as any }).where(eq(backupJobs.id, jobId));
    }

    const importedTables: string[] = [];

    // Sort tables by dependency order
    const sorted = this.topologicalSort(tables);

    await this.db.update(backupJobs).set({
      importStatus: 'importing',
    }).where(eq(backupJobs.id, jobId));

    // Wrap entire import in a transaction for atomicity
    await this.db.transaction(async (tx) => {
      for (const table of sorted) {
        const rows = data[table] as Record<string, unknown>[];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        await this.importTableData(tx, table, rows, conflictStrategy);
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

  private async importSqlBackup(
    jobId: number,
    buffer: Buffer,
    _conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    // SQL imports execute the dump directly via psql — conflict strategy cannot be applied
    // at the SQL level. This is acceptable for disaster recovery restores.
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
        url.pathname.slice(1).split('?')[0], // strip leading / and query params
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

  // ─── Dry-run: preview import without executing ───────────────────────────

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
    const manifest: BackupManifest = parsed.manifest ?? {
      version: MANIFEST_VERSION,
      backupType: job.type as any,
      createdAt: job.createdAt?.toISOString() ?? '',
      tables: [],
      recordCounts: {},
      dependencies: [],
      checksum: '',
    };

    const data: Record<string, unknown[]> = parsed.data ?? parsed;
    const conflicts: TableConflict[] = [];

    for (const [table, rows] of Object.entries(data)) {
      if (table === '_metadata' || !Array.isArray(rows)) continue;

      const existingCount = await this.getTableCount(table);
      conflicts.push({
        table,
        existingCount,
        incomingCount: rows.length,
        strategy: 'skip', // default for preview
      });
    }

    return {
      manifest,
      conflicts,
      totalRecords: conflicts.reduce((sum, c) => sum + c.incomingCount, 0),
    };
  }

  // ─── Table data import helpers ───────────────────────────────────────────
  // Uses Drizzle `sql` template for proper parameter binding.

  private async importTableData(
    tx: any, // Drizzle transaction
    table: string,
    rows: Record<string, unknown>[],
    strategy: ConflictStrategy,
  ): Promise<void> {
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);

    // Detect PK columns — check for 'id' first, then fall back to first column
    const pkColumns = this.detectPrimaryKey(columns);

    switch (strategy) {
      case 'skip':
        for (const row of rows) {
          const pkValue = this.getPkValue(row, pkColumns);
          if (pkValue == null) {
            await this.insertRow(tx, table, columns, row);
            continue;
          }
          const exists = await this.rowExists(tx, table, pkColumns, pkValue);
          if (!exists) await this.insertRow(tx, table, columns, row);
        }
        break;

      case 'overwrite':
        for (const row of rows) {
          await this.upsertRow(tx, table, columns, pkColumns, row);
        }
        break;

      case 'merge':
        for (const row of rows) {
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
        break;
    }
  }

  private detectPrimaryKey(columns: string[]): string[] {
    if (columns.includes('id')) return ['id'];
    // For composite PK tables, use the first two columns as a heuristic
    // (matches the common pattern: post_id+tag_id, role_id+permission_id, etc.)
    return columns.slice(0, 2);
  }

  private getPkValue(row: Record<string, unknown>, pkColumns: string[]): unknown {
    if (pkColumns.length === 1) return row[pkColumns[0]];
    // For composite PKs, return array of values
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
    // sql template with ${value} auto-parameterizes; sql.raw() for identifiers only
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
    const colIdentifiers = columns.map((c) => sql.raw(`"${c}"`)).join(', ');
    const values = columns.map((c) => this.sqlValue(row[c]));

    const nonPkCols = columns.filter((c) => !pkColumns.includes(c));
    const updateSet = nonPkCols.map((c) => sql.raw(`"${c}" = EXCLUDED."${c}"`)).join(', ');
    const conflictTarget = pkColumns.map((c) => sql.raw(`"${c}"`)).join(', ');

    await tx.execute(
      sql`INSERT INTO ${sql.raw(table)} (${sql.raw(colIdentifiers)}) VALUES (${values})
          ON CONFLICT (${conflictTarget}) DO UPDATE SET ${sql.raw(updateSet)}`,
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

    // Build SET clause with sql.raw() for identifiers, ${value} for parameterized values
    const setFragments = nonNullCols.map((c, i) =>
      sql`${sql.raw(`"${c}"`)} = ${this.sqlValue(row[c]) as any}`,
    );
    let setClause = setFragments[0];
    for (let i = 1; i < setFragments.length; i++) {
      setClause = sql`${setClause}, ${setFragments[i]}`;
    }

    // Build WHERE clause for composite PK
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
    // Composite PK
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

  // ─── Topological sort for table import order ─────────────────────────────

  private topologicalSort(tables: string[]): string[] {
    // Use category-defined order (parents before children)
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

  // ─── Gunzip helper ───────────────────────────────────────────────────────

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

  // ─── Delete backup ───────────────────────────────────────────────────────

  async deleteBackup(id: number): Promise<void> {
    const job = await this.getBackup(id);
    if (!job) throw new Error('Backup job not found');

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
