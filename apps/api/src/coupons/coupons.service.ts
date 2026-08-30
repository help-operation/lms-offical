import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  coupons,
  couponRecordedCourses,
  couponLiveCourses,
  courses,
  liveCourses,
} from 'src/db/schema';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';

// ─── Zod Schemas / DTOs ───────────────────────────────────────────────────────

const CreateCouponSchema = z.object({
  code:          z.string().min(2).max(50),
  type:          z.enum(['percentage', 'fixed']),
  value:         z.number().positive(),
  maxUses:       z.number().int().positive().optional(),
  expiresAt:     z.string().datetime({ offset: true }).optional(),
  scope:         z.enum(['all', 'all_recorded', 'specific_recorded', 'all_live', 'specific_live']).default('all'),
  /** Required when scope = 'specific_recorded' */
  courseIds:     z.array(z.number().int().positive()).optional(),
  /** Required when scope = 'specific_live' */
  liveCourseIds: z.array(z.number().int().positive()).optional(),
});

const UpdateCouponSchema = z.object({
  value:         z.number().positive().optional(),
  maxUses:       z.number().int().positive().nullable().optional(),
  expiresAt:     z.string().datetime({ offset: true }).nullable().optional(),
  isActive:      z.boolean().optional(),
  scope:         z.enum(['all', 'all_recorded', 'specific_recorded', 'all_live', 'specific_live']).optional(),
  courseIds:     z.array(z.number().int().positive()).optional(),
  liveCourseIds: z.array(z.number().int().positive()).optional(),
});

export class CreateCouponDto extends createZodDto(CreateCouponSchema) {}
export class UpdateCouponDto extends createZodDto(UpdateCouponSchema) {}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CouponsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async findAll(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable:  [coupons.code],
      sortable:    { createdAt: coupons.createdAt, code: coupons.code, value: coupons.value },
      filterable:  {
        type:     coupons.type,
        isActive: (v) => sql`${coupons.isActive} = ${v === 'true'}`,
        scope:    coupons.scope,
      },
      dateColumn:  coupons.createdAt,
      defaultSort: desc(coupons.createdAt),
    });

    const [rows, [countRow]] = await Promise.all([
      this.db.select().from(coupons).where(q.where).orderBy(q.orderBy).limit(q.limit).offset(q.offset),
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(coupons).where(q.where),
    ]);

    // Attach scope course/live-course IDs for each coupon
    const enriched = await Promise.all(rows.map((c) => this._attachScopeData(c)));

    return formatPaginatedResponse(enriched, countRow?.count ?? 0, q.page, q.perPage);
  }

  async create(dto: CreateCouponDto) {
    // Validate scope-specific IDs are provided
    this._validateScopeIds(dto.scope, dto.courseIds, dto.liveCourseIds);

    const [existing] = await this.db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, dto.code.toUpperCase()))
      .limit(1);

    if (existing) throw new ConflictException('Coupon code already exists');

    const [coupon] = await this.db
      .insert(coupons)
      .values({
        code:      dto.code.toUpperCase(),
        type:      dto.type,
        value:     String(dto.value),
        maxUses:   dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive:  true,
        scope:     dto.scope,
      })
      .returning();

    await this._syncScopeJunctions(coupon.id, dto.scope, dto.courseIds ?? [], dto.liveCourseIds ?? []);

    return this._attachScopeData(coupon);
  }

  async update(id: number, dto: UpdateCouponDto) {
    const [existing] = await this.db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!existing) throw new NotFoundException('Coupon not found');

    const newScope = dto.scope ?? existing.scope;
    this._validateScopeIds(newScope, dto.courseIds, dto.liveCourseIds);

    const updates: Partial<typeof coupons.$inferInsert> = {};
    if (dto.value     !== undefined) updates.value     = String(dto.value);
    if (dto.maxUses   !== undefined) updates.maxUses   = dto.maxUses;
    if (dto.expiresAt !== undefined) updates.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.isActive  !== undefined) updates.isActive  = dto.isActive;
    if (dto.scope     !== undefined) updates.scope     = dto.scope;

    const [updated] = await this.db.update(coupons).set(updates).where(eq(coupons.id, id)).returning();

    // Re-sync junction tables if scope or course lists changed
    if (dto.scope !== undefined || dto.courseIds !== undefined || dto.liveCourseIds !== undefined) {
      await this._syncScopeJunctions(id, newScope, dto.courseIds ?? [], dto.liveCourseIds ?? []);
    }

    return this._attachScopeData(updated);
  }

  async remove(id: number) {
    const [existing] = await this.db.select({ id: coupons.id }).from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!existing) throw new NotFoundException('Coupon not found');
    await this.db.delete(coupons).where(eq(coupons.id, id));
    return { deleted: true };
  }

  async toggle(id: number) {
    const [coupon] = await this.db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!coupon) throw new NotFoundException('Coupon not found');

    const [updated] = await this.db
      .update(coupons)
      .set({ isActive: !coupon.isActive })
      .where(eq(coupons.id, id))
      .returning();

    return this._attachScopeData(updated);
  }

  /** Minimal course list for the admin scope picker (recorded courses). */
  async pickerCourses() {
    return this.db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(courses.title);
  }

  /** Minimal live course list for the admin scope picker. */
  async pickerLiveCourses() {
    return this.db
      .select({ id: liveCourses.id, title: liveCourses.title })
      .from(liveCourses)
      .where(eq(liveCourses.status, 'published'))
      .orderBy(liveCourses.title);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private _validateScopeIds(
    scope: string,
    courseIds?: number[],
    liveCourseIds?: number[],
  ) {
    if (scope === 'specific_recorded' && (!courseIds || courseIds.length === 0)) {
      throw new ConflictException('courseIds are required for specific_recorded scope');
    }
    if (scope === 'specific_live' && (!liveCourseIds || liveCourseIds.length === 0)) {
      throw new ConflictException('liveCourseIds are required for specific_live scope');
    }
  }

  private async _syncScopeJunctions(
    couponId: number,
    scope: string,
    courseIds: number[],
    liveCourseIds: number[],
  ) {
    // Always clear existing junction rows first
    await this.db.delete(couponRecordedCourses).where(eq(couponRecordedCourses.couponId, couponId));
    await this.db.delete(couponLiveCourses).where(eq(couponLiveCourses.couponId, couponId));

    if (scope === 'specific_recorded' && courseIds.length > 0) {
      await this.db.insert(couponRecordedCourses).values(
        courseIds.map((courseId) => ({ couponId, courseId })),
      );
    }
    if (scope === 'specific_live' && liveCourseIds.length > 0) {
      await this.db.insert(couponLiveCourses).values(
        liveCourseIds.map((liveCourseId) => ({ couponId, liveCourseId })),
      );
    }
  }

  private async _attachScopeData(coupon: typeof coupons.$inferSelect) {
    const [recordedRows, liveRows] = await Promise.all([
      coupon.scope === 'specific_recorded'
        ? this.db
            .select({ id: courses.id, title: courses.title })
            .from(couponRecordedCourses)
            .innerJoin(courses, eq(couponRecordedCourses.courseId, courses.id))
            .where(eq(couponRecordedCourses.couponId, coupon.id))
        : Promise.resolve([]),
      coupon.scope === 'specific_live'
        ? this.db
            .select({ id: liveCourses.id, title: liveCourses.title })
            .from(couponLiveCourses)
            .innerJoin(liveCourses, eq(couponLiveCourses.liveCourseId, liveCourses.id))
            .where(eq(couponLiveCourses.couponId, coupon.id))
        : Promise.resolve([]),
    ]);

    return {
      ...coupon,
      scopeCourses:     recordedRows,
      scopeLiveCourses: liveRows,
    };
  }
}
