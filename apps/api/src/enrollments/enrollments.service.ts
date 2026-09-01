import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull, or, gt, ne, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  adminUsers,
  courses,
  courseModules,
  enrollments,
  lessonProgress,
  lessons,
  liveCourses,
  liveEnrollments,
  livePayments,
  liveSubscriptions,
  orders,
  payments,
  users,
} from 'src/db/schema';
import { paymentSummaryFrom, type PaymentSummary } from 'src/common/utils/payment-summary.util';
import { DashboardEventsService } from 'src/events/dashboard-events.service';

/** Unified row shape for the student "My Courses" list (recorded + live). */
type MyEnrollment = {
  id: number;
  status: string;
  enrolledAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  courseLevel: string;
  totalLessons: number;
  completedLessons: number;
  instructorFirstName: string;
  instructorLastName: string;
  courseType: 'recorded' | 'live';
  // Subscription fields
  paymentMode?: 'one_time' | 'subscription' | null;
  subscriptionStatus?: string | null;
  subscriptionNextBillingAt?: Date | null;
  subscriptionAmount?: string | null;
} & PaymentSummary;

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly dashboardEvents: DashboardEventsService,
  ) {}

  async enroll(userId: number, courseId: number) {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, 'published')))
      .limit(1);

    if (!course) throw new NotFoundException('Course not found');

    // Free-enroll endpoint is for FREE courses only. Paid courses must go
    // through the order/payment flow.
    if (parseFloat(course.price) > 0) {
      throw new ForbiddenException(
        'This is a paid course. Please purchase it to enrol.',
      );
    }

    const [existing] = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) throw new ConflictException('Already enrolled in this course');

    const [enrollment] = await this.db
      .insert(enrollments)
      .values({ userId, courseId, status: 'active' })
      .returning();

    await this.ensureStudentRole(userId);

    this.dashboardEvents.emit({ type: 'enrollment_created', meta: { courseId, userId } });

    return enrollment;
  }

  /** Promote a GUEST to STUDENT once they have any enrollment. No-op otherwise. */
  private async ensureStudentRole(userId: number) {
    await this.db
      .update(users)
      .set({ role: 'STUDENT' })
      .where(and(eq(users.id, userId), eq(users.role, 'GUEST')));
  }

  async getMyEnrollments(userId: number): Promise<MyEnrollment[]> {
    // ── Recorded-course enrollments (with lesson progress) ───────────────────
    const now = new Date();

    const paidSums = this.db
      .select({
        orderId: payments.orderId,
        paid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`.as('paid'),
      })
      .from(payments)
      .where(eq(payments.status, 'completed'))
      .groupBy(payments.orderId)
      .as('paid_sums');

    const livePaidSums = this.db
      .select({
        liveEnrollmentId: livePayments.liveEnrollmentId,
        paid: sql<string>`COALESCE(SUM(${livePayments.amount}), 0)`.as('paid'),
      })
      .from(livePayments)
      .where(eq(livePayments.status, 'completed'))
      .groupBy(livePayments.liveEnrollmentId)
      .as('live_paid_sums');

    const recordedRows = await this.db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        completedAt: enrollments.completedAt,
        expiresAt: enrollments.expiresAt,
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnail,
        courseLevel: courses.level,
        totalLessons: sql<number>`(
          SELECT COUNT(*) FROM lessons l
          JOIN course_modules cm ON l.module_id = cm.id
          WHERE cm.course_id = ${courses.id}
        )`.mapWith(Number),
        completedLessons: sql<number>`(
          SELECT COUNT(*) FROM lesson_progress lp
          WHERE lp.user_id = ${userId} AND lp.course_id = ${courses.id} AND lp.completed_at IS NOT NULL
        )`.mapWith(Number),
        instructorFirstName: adminUsers.firstName,
        instructorLastName: adminUsers.lastName,
        feeAmount: orders.finalAmount,
        paidAmount: paidSums.paid,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(adminUsers, eq(courses.instructorId, adminUsers.id))
      .leftJoin(orders, eq(enrollments.orderId, orders.id))
      .leftJoin(paidSums, eq(paidSums.orderId, orders.id))
      .where(eq(enrollments.userId, userId));

    const recorded: MyEnrollment[] = recordedRows.map(({ feeAmount, paidAmount, ...r }) => ({
      ...r,
      status: r.status === 'active' && r.expiresAt && r.expiresAt <= now ? 'expired' : r.status,
      courseType: 'recorded',
      ...paymentSummaryFrom(feeAmount, paidAmount, false),
    }));

    // ── Live-course enrollments (no lesson progress model) ───────────────────
    const liveRows = await this.db
      .select({
        id: liveEnrollments.id,
        status: liveEnrollments.status,
        paidAt: liveEnrollments.paidAt,
        createdAt: liveEnrollments.createdAt,
        expiresAt: liveEnrollments.expiresAt,
        courseId: liveCourses.id,
        courseTitle: liveCourses.title,
        courseSlug: liveCourses.slug,
        hero: liveCourses.hero,
        feeAmount: liveEnrollments.amount,
        paidAmount: livePaidSums.paid,
        paymentMode: liveEnrollments.paymentMode,
        subscriptionStatus: liveSubscriptions.status,
        subscriptionNextBillingAt: liveSubscriptions.nextBillingAt,
        subscriptionAmount: liveSubscriptions.monthlyPrice,
      })
      .from(liveEnrollments)
      .innerJoin(liveCourses, eq(liveEnrollments.liveCourseId, liveCourses.id))
      .leftJoin(livePaidSums, eq(livePaidSums.liveEnrollmentId, liveEnrollments.id))
      .leftJoin(liveSubscriptions, eq(liveSubscriptions.enrollmentId, liveEnrollments.id))
      .where(and(eq(liveEnrollments.userId, userId), ne(liveCourses.courseType, 'bundle')));

    const live: MyEnrollment[] = liveRows.map((r) => {
      const isExpired = r.expiresAt && r.expiresAt <= now;
      // 'completed' = has access (live courses use this as the active state).
      // Suspended or expired override regardless.
      const resolvedStatus = isExpired
        ? 'expired'
        : r.status === 'suspended'
          ? 'suspended'
          : r.status === 'completed'
            ? 'active'
            : r.status;
      return {
        id: r.id,
        status: resolvedStatus,
        enrolledAt: r.paidAt ?? r.createdAt,
        completedAt: null,
        expiresAt: r.expiresAt,
        courseId: r.courseId,
        courseTitle: r.courseTitle,
        courseSlug: r.courseSlug,
        courseThumbnail: r.hero?.bannerImage ?? null,
        courseLevel: 'beginner',
        totalLessons: 0,
        completedLessons: 0,
        instructorFirstName: '',
        instructorLastName: '',
        courseType: 'live',
        paymentMode: (r.paymentMode as 'one_time' | 'subscription') ?? null,
        subscriptionStatus: r.subscriptionStatus ?? null,
        subscriptionNextBillingAt: r.subscriptionNextBillingAt,
        subscriptionAmount: r.subscriptionAmount,
        ...paymentSummaryFrom(r.feeAmount, r.paidAmount, r.status === 'completed'),
      };
    });

    // Newest first, across both course types.
    return [...recorded, ...live].sort(
      (a, b) =>
        (b.enrolledAt?.getTime() ?? 0) - (a.enrolledAt?.getTime() ?? 0),
    );
  }

  async isEnrolled(userId: number, courseId: number): Promise<boolean> {
    const info = await this.getEnrollmentInfo(userId, courseId);
    return info.enrolled;
  }

  async getEnrollmentInfo(
    userId: number,
    courseId: number,
  ): Promise<{ enrolled: boolean; reason: 'suspended' | 'expired' | null; statusReason?: string | null; expiresAt?: string | null }> {
    const now = new Date();
    const [row] = await this.db
      .select({ status: enrollments.status, expiresAt: enrollments.expiresAt, statusReason: enrollments.statusReason })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!row) return { enrolled: false, reason: null };
    if (row.status === 'suspended') return { enrolled: false, reason: 'suspended', statusReason: row.statusReason };
    if (row.expiresAt && row.expiresAt <= now) return { enrolled: false, reason: 'expired', expiresAt: row.expiresAt.toISOString() };
    if (row.status !== 'active' && row.status !== 'completed') return { enrolled: false, reason: null };
    return { enrolled: true, reason: null };
  }

  async getCourseCurriculum(userId: number, courseId: number) {
    const enrolled = await this.isEnrolled(userId, courseId);
    if (!enrolled) throw new ForbiddenException('Not enrolled in this course');

    const mods = await this.db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    const lessonRows = await this.db
      .select()
      .from(lessons)
      .where(
        sql`${lessons.moduleId} IN (SELECT id FROM course_modules WHERE course_id = ${courseId})`,
      )
      .orderBy(asc(lessons.order));

    const progressRows = await this.db
      .select()
      .from(lessonProgress)
      .where(
        and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)),
      );

    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));
    const lessonsByModule = new Map<number, typeof lessonRows>();

    for (const lesson of lessonRows) {
      const arr = lessonsByModule.get(lesson.moduleId) ?? [];
      arr.push(lesson);
      lessonsByModule.set(lesson.moduleId, arr);
    }

    // Sequential lock: every lesson is locked until all prior lessons are completed.
    // Free-preview lessons are always exempt from locking.
    const lockedIds = new Set<number>();
    let allPreviousDone = true;
    for (const mod of mods) {
      for (const lesson of lessonsByModule.get(mod.id) ?? []) {
        if (lesson.isFree) continue; // free previews are always accessible
        if (!allPreviousDone) lockedIds.add(lesson.id);
        if (!progressMap.get(lesson.id)?.completedAt) allPreviousDone = false;
      }
    }

    return mods.map((mod) => ({
      ...mod,
      lessons: (lessonsByModule.get(mod.id) ?? []).map((lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) ?? null,
        isLocked: lockedIds.has(lesson.id),
      })),
    }));
  }
}
