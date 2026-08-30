import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { announcements } from 'src/db/schema';
import {
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  expiresAt?: string | null;
}

export interface UpdateAnnouncementDto extends Partial<CreateAnnouncementDto> {}

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ─── Admin: Create ────────────────────────────────────────────────────────

  async create(dto: CreateAnnouncementDto) {
    const [row] = await this.db
      .insert(announcements)
      .values({
        title:     dto.title,
        body:      dto.body,
        type:      dto.type ?? 'info',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })
      .returning();
    return row;
  }

  // ─── Admin: List all ─────────────────────────────────────────────────────

  async listAll(params: TableQueryInput) {
    const page    = Math.max(1, Number(params.page)      || 1);
    const perPage = Math.min(100, Number(params.per_page) || 20);
    const offset  = (page - 1) * perPage;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(announcements)
        .orderBy(desc(announcements.createdAt))
        .limit(perPage)
        .offset(offset),

      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(announcements),
    ]);

    const [[activeRow]] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(announcements)
        .where(eq(announcements.isActive, true)),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow?.count ?? 0, page, perPage),
      stats: { total: countRow?.count ?? 0, active: activeRow?.count ?? 0 },
    };
  }

  // ─── Admin: Update ────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateAnnouncementDto) {
    const [row] = await this.db
      .update(announcements)
      .set({
        ...(dto.title     !== undefined && { title:     dto.title }),
        ...(dto.body      !== undefined && { body:      dto.body }),
        ...(dto.type      !== undefined && { type:      dto.type }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (!row) throw new NotFoundException('Announcement not found');
    return row;
  }

  // ─── Admin: Toggle active ─────────────────────────────────────────────────

  async toggle(id: number) {
    const [current] = await this.db
      .select({ isActive: announcements.isActive })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!current) throw new NotFoundException('Announcement not found');

    const [row] = await this.db
      .update(announcements)
      .set({ isActive: !current.isActive, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();

    return row;
  }

  // ─── Admin: Delete ────────────────────────────────────────────────────────

  async delete(id: number) {
    const [row] = await this.db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning({ id: announcements.id });

    if (!row) throw new NotFoundException('Announcement not found');
    return row;
  }

  // ─── Public/Student: Active announcements ─────────────────────────────────

  async listActive() {
    const rows = await this.db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          // Not expired (expiresAt IS NULL OR expiresAt > NOW())
          or(
            isNull(announcements.expiresAt),
            gt(announcements.expiresAt, new Date()),
          ),
        ),
      )
      .orderBy(desc(announcements.createdAt))
      .limit(10);

    return rows;
  }
}
