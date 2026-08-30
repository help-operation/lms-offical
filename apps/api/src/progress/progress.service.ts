import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  assignments,
  assignmentSubmissions,
  courses,
  courseModules,
  enrollments,
  lessonProgress,
  lessons,
} from 'src/db/schema';
import { CertificatesService } from 'src/certificates/certificates.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly certificatesService: CertificatesService,
  ) {}

  private async getLessonCourseId(lessonId: number): Promise<number> {
    const [row] = await this.db
      .select({ courseId: courseModules.courseId })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!row) throw new NotFoundException('Lesson not found');
    return row.courseId;
  }

  // Assignment lessons can't be marked complete until the student has
  // actually submitted — otherwise "Next" would silently skip the gate the
  // instructor set up (see assignments.filesRequired / maxFiles).
  private async assertAssignmentSubmitted(userId: number, lessonId: number) {
    const [lesson] = await this.db
      .select({ type: lessons.type })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson || lesson.type !== 'assignment') return;

    const [assignment] = await this.db
      .select({ id: assignments.id })
      .from(assignments)
      .where(eq(assignments.lessonId, lessonId))
      .limit(1);
    if (!assignment) return; // no assignment configured — nothing to gate on

    const [submission] = await this.db
      .select({ id: assignmentSubmissions.id })
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignment.id),
          eq(assignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);
    if (!submission) {
      throw new BadRequestException(
        'Submit your assignment before you can continue to the next lesson',
      );
    }
  }

  private async assertEnrolled(userId: number, courseId: number) {
    const [row] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId),
          // 'completed' stays valid: finishing a course flips the enrollment
          // to 'completed', but the student may still mark later-added lessons.
          inArray(enrollments.status, ['active', 'completed']),
        ),
      )
      .limit(1);

    if (!row) throw new ForbiddenException('Not enrolled in this course');
  }

  /** Count total vs. completed lessons for a course. Used by both the
   *  progress endpoint and the auto-issue check in markComplete. */
  private async countProgress(userId: number, courseId: number) {
    const [totalRow] = await this.db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId));

    const [completedRow] = await this.db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.courseId, courseId),
          sql`${lessonProgress.completedAt} IS NOT NULL`,
        ),
      );

    const total = totalRow?.count ?? 0;
    const completed = completedRow?.count ?? 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }

  async markComplete(userId: number, lessonId: number) {
    const courseId = await this.getLessonCourseId(lessonId);
    await this.assertEnrolled(userId, courseId);
    await this.assertAssignmentSubmitted(userId, lessonId);

    const [row] = await this.db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        courseId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { completedAt: new Date(), updatedAt: new Date() },
      })
      .returning();

    // Auto-issue a certificate the moment the course hits 100%. This is
    // idempotent and best-effort — a hiccup here must never fail the
    // lesson-completion request itself.
    const { total, completed } = await this.countProgress(userId, courseId);
    const courseCompleted = total > 0 && completed >= total;

    let certificate: Awaited<
      ReturnType<CertificatesService['claimCertificate']>
    > | null = null;

    if (courseCompleted) {
      try {
        certificate = await this.certificatesService.claimCertificate(
          userId,
          courseId,
        );
      } catch (err) {
        this.logger.error(
          `Auto-issue certificate failed (user ${userId}, course ${courseId})`,
          err as Error,
        );
      }
    }

    return { ...row, courseCompleted, certificate };
  }

  async getCourseProgress(userId: number, courseId: number) {
    const [course] = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) throw new NotFoundException('Course not found');
    await this.assertEnrolled(userId, courseId);

    return this.countProgress(userId, courseId);
  }

  async updateWatchedSeconds(userId: number, lessonId: number, watchedSeconds: number) {
    const courseId = await this.getLessonCourseId(lessonId);

    await this.db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        courseId,
        watchedSeconds,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { watchedSeconds, updatedAt: new Date() },
      });
  }
}
