import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { liveCourseBatches, liveCourses, liveEnrollments } from 'src/db/schema';

@Injectable()
export class LiveCourseBatchesService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ── List all batches for a course ─────────────────────────────────────────

  async listByCourse(courseId: number) {
    const batches = await this.db
      .select()
      .from(liveCourseBatches)
      .where(eq(liveCourseBatches.liveCourseId, courseId))
      .orderBy(liveCourseBatches.createdAt);

    // Accurate count of *paid* (completed) enrollments per batch — used by the
    // UI to disable the delete button and shown as "X enrolled".
    const counts = await this.db
      .select({
        batchId: liveEnrollments.batchId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, courseId),
          eq(liveEnrollments.status, 'completed'),
        ),
      )
      .groupBy(liveEnrollments.batchId);

    const countByBatch = new Map(counts.map((c) => [c.batchId, c.count]));

    return batches.map((b) => ({
      ...b,
      enrolledCount: countByBatch.get(b.id) ?? 0,
    }));
  }

  // ── Get the current active/upcoming batch (used by public API) ────────────

  async getActiveBatch(courseId: number) {
    // 1. First try: a batch explicitly set to 'active'
    const [active] = await this.db
      .select()
      .from(liveCourseBatches)
      .where(
        and(
          eq(liveCourseBatches.liveCourseId, courseId),
          eq(liveCourseBatches.status, 'active'),
        ),
      )
      .limit(1);

    if (active) return active;

    // 2. Fallback: the earliest 'upcoming' batch
    const [upcoming] = await this.db
      .select()
      .from(liveCourseBatches)
      .where(
        and(
          eq(liveCourseBatches.liveCourseId, courseId),
          eq(liveCourseBatches.status, 'upcoming'),
        ),
      )
      .orderBy(liveCourseBatches.createdAt)
      .limit(1);

    return upcoming ?? null;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(
    courseId: number,
    dto: {
      batchName: string;
      status?: 'upcoming' | 'active' | 'ended';
      startDate?: string;
      endDate?: string;
      schedule?: string;
      supportSchedule?: string;
      maxSeats?: number;
      countdownEnd?: string;
      notes?: string;
    },
  ) {
    // Verify course exists
    const [course] = await this.db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(eq(liveCourses.id, courseId))
      .limit(1);

    if (!course) throw new NotFoundException('Live course not found');

    const [batch] = await this.db
      .insert(liveCourseBatches)
      .values({
        liveCourseId:    courseId,
        batchName:       dto.batchName,
        status:          dto.status ?? 'upcoming',
        startDate:       dto.startDate ?? null,
        endDate:         dto.endDate   ?? null,
        schedule:        dto.schedule  ?? null,
        supportSchedule: dto.supportSchedule ?? null,
        maxSeats:        dto.maxSeats ?? null,
        seatsFilled:     0,
        countdownEnd:    dto.countdownEnd ?? null,
        notes:           dto.notes ?? null,
      })
      .returning();

    return batch;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(
    batchId: number,
    dto: {
      batchName?: string;
      status?: 'upcoming' | 'active' | 'ended';
      startDate?: string | null;
      endDate?: string | null;
      schedule?: string | null;
      supportSchedule?: string | null;
      maxSeats?: number | null;
      countdownEnd?: string | null;
      notes?: string | null;
    },
  ) {
    const [existing] = await this.db
      .select({ id: liveCourseBatches.id })
      .from(liveCourseBatches)
      .where(eq(liveCourseBatches.id, batchId))
      .limit(1);

    if (!existing) throw new NotFoundException('Batch not found');

    const [updated] = await this.db
      .update(liveCourseBatches)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(liveCourseBatches.id, batchId))
      .returning();

    return updated;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(batchId: number) {
    const [existing] = await this.db
      .select({ id: liveCourseBatches.id })
      .from(liveCourseBatches)
      .where(eq(liveCourseBatches.id, batchId))
      .limit(1);

    if (!existing) throw new NotFoundException('Batch not found');

    // Guard: a batch with paid (completed) enrollments cannot be deleted —
    // deleting it would orphan those students (batchId is ON DELETE SET NULL).
    const [enrolled] = await this.db
      .select({ id: liveEnrollments.id })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.batchId, batchId),
          eq(liveEnrollments.status, 'completed'),
        ),
      )
      .limit(1);

    if (enrolled) {
      throw new ConflictException(
        'Cannot delete a batch that has enrolled students.',
      );
    }

    await this.db
      .delete(liveCourseBatches)
      .where(eq(liveCourseBatches.id, batchId));

    return { deleted: true };
  }

  // ── Increment seats filled (called on enrollment) ─────────────────────────

  async incrementSeatsFilled(batchId: number) {
    await this.db
      .update(liveCourseBatches)
      .set({ seatsFilled: (await this.db
        .select({ v: liveCourseBatches.seatsFilled })
        .from(liveCourseBatches)
        .where(eq(liveCourseBatches.id, batchId))
        .limit(1)
        .then(r => (r[0]?.v ?? 0) + 1)
      )})
      .where(eq(liveCourseBatches.id, batchId));
  }
}
