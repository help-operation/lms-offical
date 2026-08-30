import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  certificates,
  courses,
  courseModules,
  enrollments,
  lessonProgress,
  lessons,
  liveCertificates,
  liveCourses,
  liveLessonProgress,
  liveCourseLessons,
  users,
} from 'src/db/schema';
import {
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';
import { EmailTemplatesService } from 'src/email-templates/email-templates.service';
import { SmsTemplatesService } from 'src/sms/sms-templates.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';
import { deriveCertPrefix } from 'src/common/utils/cert-prefix.util';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly smsTemplates: SmsTemplatesService,
    private readonly activityLogs: ActivityLogsService,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  // e.g. "Learning Management System" → LMS-A3F7B2D1E9C4
  private async generateCertCode(): Promise<string> {
    const { general_site_name } = await this.systemSettings.getByKeys(['general_site_name']);
    const prefix = deriveCertPrefix(general_site_name || 'Skillkoro');
    const hex = randomUUID().replace(/-/g, '').toUpperCase().substring(0, 12);
    return `${prefix}-${hex}`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Fire-and-forget notification email when a certificate is newly issued.
   *  Best-effort — never throws into the issuing flow. */
  private async notifyStudent(
    userId: number,
    courseId: number,
    code: string,
  ): Promise<void> {
    try {
      const [user] = await this.db
        .select({
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          emailNotifications: users.emailNotifications,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const [course] = await this.db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3001';
      const verifyUrl = `${frontendBase}/certificate/${code}`;

      // Email (respects the user's email-notification preference).
      if (user?.email && user.emailNotifications) {
        await this.emailTemplates.send('certificate_issued', user.email, {
          student_name: `${user.firstName} ${user.lastName}`.trim(),
          course_title: course?.title ?? 'your course',
          certificate_code: code,
          certificate_url: verifyUrl,
        });
      }

      // SMS (best-effort, only if the student has a phone). Completion + the
      // certificate link fire together; admins can disable either template.
      await this.smsTemplates.send('course_completed', user?.phone, {
        name: user?.firstName ?? 'there',
        course_title: course?.title ?? 'your course',
      });
      await this.smsTemplates.send('certificate_ready', user?.phone, {
        name: user?.firstName ?? 'there',
        course_title: course?.title ?? 'your course',
        verify_url: verifyUrl,
      });
    } catch (err) {
      this.logger.error('Certificate notification failed', err as Error);
    }
  }

  private async getCourseProgress(userId: number, courseId: number) {
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
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }

  // ─── Student: Claim certificate after completing course ───────────────────

  async claimCertificate(userId: number, courseId: number) {
    // 1. Must be enrolled
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) throw new NotFoundException('You are not enrolled in this course');

    // 2. Already issued — idempotent
    const [existing] = await this.db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);

    if (existing) return existing;

    // 3. Must have completed all lessons
    const { total, completed } = await this.getCourseProgress(userId, courseId);
    if (total === 0 || completed < total) {
      throw new ForbiddenException(
        `Complete all lessons first (${completed}/${total} done)`,
      );
    }

    // 4. Issue certificate
    const code = await this.generateCertCode();
    const [cert] = await this.db
      .insert(certificates)
      .values({ userId, courseId, certificateCode: code })
      .onConflictDoNothing()
      .returning();

    // 5. Mark enrollment completed
    await this.db
      .update(enrollments)
      .set({ status: 'completed', completedAt: new Date() })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    // 6. Notify the student (best-effort) only when a new cert was created.
    if (cert) {
      void this.notifyStudent(userId, courseId, cert.certificateCode);
      void this.activityLogs.log({ userId, action: 'certificate_claimed', entity: 'certificate', entityId: cert.id, meta: { courseId } });
    }

    return cert ?? existing;
  }

  // ─── Student: My certificates (recorded + live) ───────────────────────────

  async getMyCertificates(userId: number) {
    const [recorded, live] = await Promise.all([
      this.db
        .select({
          id:              certificates.id,
          certificateCode: certificates.certificateCode,
          certificateUrl:  certificates.certificateUrl,
          issuedAt:        certificates.issuedAt,
          courseId:        courses.id,
          liveCourseId:    sql<null>`NULL`.mapWith(() => null as null),
          courseTitle:     courses.title,
          courseSlug:      courses.slug,
          courseThumbnail: courses.thumbnail,
        })
        .from(certificates)
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(eq(certificates.userId, userId)),

      this.db
        .select({
          id:              liveCertificates.id,
          certificateCode: liveCertificates.certificateCode,
          certificateUrl:  liveCertificates.certificateUrl,
          issuedAt:        liveCertificates.issuedAt,
          courseId:        sql<null>`NULL`.mapWith(() => null as null),
          liveCourseId:    liveCourses.id,
          courseTitle:     liveCourses.title,
          courseSlug:      liveCourses.slug,
          courseThumbnail: sql<null>`NULL`.mapWith(() => null as null),
        })
        .from(liveCertificates)
        .innerJoin(liveCourses, eq(liveCertificates.liveCourseId, liveCourses.id))
        .where(eq(liveCertificates.userId, userId)),
    ]);

    return [...recorded, ...live].sort(
      (a, b) => (b.issuedAt?.getTime() ?? 0) - (a.issuedAt?.getTime() ?? 0),
    );
  }

  // ─── Student: Claim live course certificate ───────────────────────────────

  async claimLiveCertificate(userId: number, liveCourseId: number) {
    const [course] = await this.db
      .select({ id: liveCourses.id, title: liveCourses.title })
      .from(liveCourses)
      .where(eq(liveCourses.id, liveCourseId))
      .limit(1);
    if (!course) throw new NotFoundException('Live course not found');

    const [existing] = await this.db
      .select()
      .from(liveCertificates)
      .where(and(eq(liveCertificates.userId, userId), eq(liveCertificates.liveCourseId, liveCourseId)))
      .limit(1);
    if (existing) return existing;

    // Verify all lessons completed
    const [totalRow] = await this.db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.liveCourseId, liveCourseId));

    const [completedRow] = await this.db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(liveLessonProgress)
      .where(
        and(
          eq(liveLessonProgress.userId, userId),
          eq(liveLessonProgress.liveCourseId, liveCourseId),
          sql`${liveLessonProgress.completedAt} IS NOT NULL`,
        ),
      );

    const total = totalRow?.count ?? 0;
    const completed = completedRow?.count ?? 0;
    if (total === 0 || completed < total) {
      throw new ForbiddenException(`Complete all lessons first (${completed}/${total} done)`);
    }

    const [cert] = await this.db
      .insert(liveCertificates)
      .values({ userId, liveCourseId, certificateCode: await this.generateCertCode() })
      .onConflictDoNothing()
      .returning();

    return cert ?? existing;
  }

  // ─── Public: Verify by code ───────────────────────────────────────────────

  async findByCode(code: string) {
    const [row] = await this.db
      .select({
        id:              certificates.id,
        certificateCode: certificates.certificateCode,
        certificateUrl:  certificates.certificateUrl,
        issuedAt:        certificates.issuedAt,
        userId:          users.id,
        userFirstName:   users.firstName,
        userLastName:    users.lastName,
        courseId:        courses.id,
        courseTitle:     courses.title,
        courseSlug:      courses.slug,
        courseThumbnail: courses.thumbnail,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.certificateCode, code))
      .limit(1);

    if (!row) throw new NotFoundException('Certificate not found');

    return {
      ...row,
      studentName: `${row.userFirstName} ${row.userLastName}`.trim(),
    };
  }

  // ─── Admin: List all certificates ────────────────────────────────────────

  async listAll(params: TableQueryInput) {
    const page    = Math.max(1, Number(params.page)     || 1);
    const perPage = Math.min(100, Number(params.per_page) || 20);
    const offset  = (page - 1) * perPage;
    const search    = (params.search    as string | undefined)?.trim() ?? '';
    const dateFrom  = (params.date_from as string | undefined)?.trim() ?? '';
    const dateTo    = (params.date_to   as string | undefined)?.trim() ?? '';

    const conds: SQL[] = [];
    if (search) {
      conds.push(or(
        ilike(users.firstName,              `%${search}%`),
        ilike(users.lastName,               `%${search}%`),
        ilike(users.email,                  `%${search}%`),
        ilike(courses.title,                `%${search}%`),
        ilike(certificates.certificateCode, `%${search}%`),
      ) as SQL);
    }
    if (dateFrom) conds.push(gte(certificates.issuedAt, new Date(dateFrom)) as SQL);
    if (dateTo)   conds.push(lte(certificates.issuedAt, new Date(dateTo + 'T23:59:59')) as SQL);
    const where = conds.length ? and(...conds) : undefined;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select({
          id:              certificates.id,
          certificateCode: certificates.certificateCode,
          certificateUrl:  certificates.certificateUrl,
          issuedAt:        certificates.issuedAt,
          userId:          users.id,
          userFirstName:   users.firstName,
          userLastName:    users.lastName,
          userEmail:       users.email,
          userAvatar:      users.avatar,
          courseId:        courses.id,
          courseTitle:     courses.title,
          courseSlug:      courses.slug,
        })
        .from(certificates)
        .innerJoin(users,   eq(certificates.userId,   users.id))
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(where)
        .orderBy(desc(certificates.issuedAt))
        .limit(perPage)
        .offset(offset),

      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(certificates)
        .innerJoin(users,   eq(certificates.userId,   users.id))
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(where),
    ]);

    // Stats
    const [[totalRow], [thisMonthRow]] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(certificates),
      this.db
        .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
        .from(certificates)
        .where(sql`DATE_TRUNC('month', ${certificates.issuedAt}) = DATE_TRUNC('month', NOW())`),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow?.count ?? 0, page, perPage),
      stats: {
        total:     totalRow?.count     ?? 0,
        thisMonth: thisMonthRow?.count ?? 0,
      },
    };
  }

  // ─── Admin: Manually issue certificate (bypasses progress check) ──────────

  async issueManually(userId: number, courseId: number) {
    // Check user exists
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException('User not found');

    // Check course exists
    const [course] = await this.db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) throw new NotFoundException('Course not found');

    // Idempotent — return existing
    const [existing] = await this.db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)))
      .limit(1);

    if (existing) throw new ConflictException('Certificate already issued for this student and course');

    const code = await this.generateCertCode();
    const [cert] = await this.db
      .insert(certificates)
      .values({ userId, courseId, certificateCode: code })
      .returning();

    void this.notifyStudent(userId, courseId, cert.certificateCode);
    void this.activityLogs.log({ action: 'certificate_issued_manually', entity: 'certificate', entityId: cert.id, meta: { userId, courseId } });

    return cert;
  }
}
