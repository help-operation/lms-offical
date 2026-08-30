import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { mediaFiles } from 'src/db/schema';
import { UploadService } from 'src/upload/upload.service';

// ─── Helpers ───────────────────────────────────────────────────────────────────

type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

function getMimeType(mime: string): MediaType {
  if (mime.startsWith('image/'))   return 'image';
  if (mime.startsWith('video/'))   return 'video';
  if (mime.startsWith('audio/'))   return 'audio';
  if (
    mime === 'application/pdf'        ||
    mime.includes('word')             ||
    mime.includes('excel')            ||
    mime.includes('powerpoint')       ||
    mime.includes('spreadsheet')      ||
    mime.includes('presentation')     ||
    mime.includes('opendocument')     ||
    mime === 'text/plain'             ||
    mime === 'text/csv'
  ) return 'document';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface ListMediaParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  sortField?: 'created_at' | 'filename' | 'size' | 'type';
  sortDirection?: 'asc' | 'desc';
}

export interface RegisterMediaDto {
  url:          string;
  key:          string;
  filename:     string;
  originalName: string;
  mimeType:     string;
  size:         number;
  uploadedBy?:  number;
}

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MediaService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly uploadService: UploadService,
  ) {}

  // ── Presign (delegates to UploadService) ────────────────────────────────────

  presign(mimeType: string, filename: string) {
    if (!mimeType) throw new BadRequestException('mimeType is required');
    if (!filename) throw new BadRequestException('filename is required');
    return this.uploadService.createMediaPresignUrl(mimeType, filename);
  }

  // ── Register (save file metadata after R2 upload) ───────────────────────────

  async register(dto: RegisterMediaDto) {
    const type = getMimeType(dto.mimeType);

    const [row] = await this.db
      .insert(mediaFiles)
      .values({
        filename:     dto.filename,
        originalName: dto.originalName,
        mimeType:     dto.mimeType,
        size:         dto.size,
        type,
        url:          dto.url,
        thumbnailUrl: type === 'image' ? dto.url : null,
        uploadedBy:   dto.uploadedBy ?? null,
      })
      .returning();

    return { ...row, formattedSize: formatBytes(row.size) };
  }

  // ── List ────────────────────────────────────────────────────────────────────

  async list(params: ListMediaParams) {
    const page    = Math.max(1, params.page ?? 1);
    const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
    const offset  = (page - 1) * perPage;

    const conditions: SQL[] = [];

    if (params.search) {
      const like       = `%${params.search}%`;
      const searchClause = or(
        ilike(mediaFiles.filename,     like),
        ilike(mediaFiles.originalName, like),
        sql<boolean>`${mediaFiles.altText} ilike ${like}`,
      );
      if (searchClause) conditions.push(searchClause);
    }

    if (params.type && params.type !== 'all') {
      conditions.push(sql<boolean>`${mediaFiles.type} = ${params.type}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderCol = (() => {
      switch (params.sortField) {
        case 'filename': return mediaFiles.filename;
        case 'size':     return mediaFiles.size;
        case 'type':     return mediaFiles.type;
        default:         return mediaFiles.createdAt;
      }
    })();
    const orderDir = params.sortDirection === 'asc' ? sql`ASC` : sql`DESC`;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(mediaFiles)
        .where(where)
        .orderBy(sql`${orderCol} ${orderDir}`)
        .limit(perPage)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(mediaFiles)
        .where(where),
    ]);

    // Summary always over the full table (not the filtered subset)
    const [summary] = await this.db
      .select({
        totalFiles:     sql<number>`count(*)::int`,
        totalSize:      sql<number>`coalesce(sum(${mediaFiles.size}), 0)::bigint`,
        totalImages:    sql<number>`count(*) filter (where ${mediaFiles.type} = 'image')::int`,
        totalVideos:    sql<number>`count(*) filter (where ${mediaFiles.type} = 'video')::int`,
        totalDocuments: sql<number>`count(*) filter (where ${mediaFiles.type} = 'document')::int`,
      })
      .from(mediaFiles);

    const totalPages = Math.max(1, Math.ceil(count / perPage));
    const data       = rows.map((r) => ({ ...r, formattedSize: formatBytes(r.size) }));

    return {
      data,
      pagination: {
        current_page: page,
        per_page:     perPage,
        total:        count,
        last_page:    totalPages,
        from:         offset + 1,
        to:           Math.min(offset + perPage, count),
      },
      summary: {
        total_files:     summary.totalFiles,
        total_size:      Number(summary.totalSize),
        total_images:    summary.totalImages,
        total_videos:    summary.totalVideos,
        total_documents: summary.totalDocuments,
      },
    };
  }

  // ── Update metadata ─────────────────────────────────────────────────────────

  async update(
    id: number,
    data: { filename?: string; altText?: string; caption?: string },
  ) {
    const [existing] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id));

    if (!existing) throw new NotFoundException('Media file not found');

    const [updated] = await this.db
      .update(mediaFiles)
      .set({
        ...(data.filename !== undefined ? { filename: data.filename.trim() }           : {}),
        ...(data.altText  !== undefined ? { altText:  data.altText?.trim()  || null }  : {}),
        ...(data.caption  !== undefined ? { caption:  data.caption?.trim()  || null }  : {}),
        updatedAt: new Date(),
      })
      .where(eq(mediaFiles.id, id))
      .returning();

    return { ...updated, formattedSize: formatBytes(updated.size) };
  }

  // ── Delete one ──────────────────────────────────────────────────────────────

  async delete(id: number) {
    const [existing] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id));

    if (!existing) throw new NotFoundException('Media file not found');

    await this.uploadService.deleteMediaFile(existing.url);
    await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));

    return { deleted: true };
  }

  // ── Bulk delete ─────────────────────────────────────────────────────────────

  async bulkDelete(ids: number[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };

    const rows = await this.db
      .select()
      .from(mediaFiles)
      .where(inArray(mediaFiles.id, ids));

    await Promise.allSettled(rows.map((r) => this.uploadService.deleteMediaFile(r.url)));
    await this.db.delete(mediaFiles).where(inArray(mediaFiles.id, ids));

    return { deleted: rows.length };
  }
}
