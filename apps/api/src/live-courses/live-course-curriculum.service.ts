import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveCourses,
  liveCourseModules,
  liveCourseLessons,
  liveEnrollments,
  liveLessonProgress,
  liveCertificates,
  liveNotes,
  liveSubscriptions,
  users,
} from 'src/db/schema';
import { BunnyStreamService } from 'src/bunny-stream/bunny-stream.service';
import { canEditLiveCourse } from 'src/common/rbac/course-access';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';
import { deriveCertPrefix } from 'src/common/utils/cert-prefix.util';

@Injectable()
export class LiveCourseCurriculumService {
  private readonly logger = new Logger(LiveCourseCurriculumService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bunny: BunnyStreamService,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  private async generateCertCode(): Promise<string> {
    const { general_site_name } = await this.systemSettings.getByKeys(['general_site_name']);
    const prefix = deriveCertPrefix(general_site_name || 'Skillkoro');
    const hex = randomUUID().replace(/-/g, '').toUpperCase().substring(0, 12);
    return `${prefix}-${hex}`;
  }

  // ── Ownership guards (admin only) ─────────────────────────────────────────

  private async assertCourseExists(liveCourseId: number) {
    const [course] = await this.db
      .select({ id: liveCourses.id })
      .from(liveCourses)
      .where(eq(liveCourses.id, liveCourseId))
      .limit(1);
    if (!course) throw new NotFoundException('Live course not found');
    return course;
  }

  /** Admin-only: existence + course-scoped edit access (see `canEditLiveCourse`). */
  private async assertCanEditLiveCourse(liveCourseId: number, adminUserId: number, isAdmin: boolean) {
    await this.assertCourseExists(liveCourseId);
    if (!(await canEditLiveCourse(this.db, liveCourseId, adminUserId, isAdmin))) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async assertModuleExists(moduleId: number) {
    const [mod] = await this.db
      .select()
      .from(liveCourseModules)
      .where(eq(liveCourseModules.id, moduleId))
      .limit(1);
    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  private async assertLessonExists(lessonId: number) {
    const [lesson] = await this.db
      .select()
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  // ── Enrollment check (student) ────────────────────────────────────────────
  // Returns the enrollment if found, auto-linking userId by email if needed.

  private async assertEnrolled(liveCourseId: number, userId: number) {
    // Try by userId first
    const [byUser] = await this.db
      .select({ id: liveEnrollments.id, status: liveEnrollments.status, expiresAt: liveEnrollments.expiresAt, paymentMode: liveEnrollments.paymentMode })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.userId, userId),
        ),
      )
      .limit(1);

    if (byUser) return this.checkEnrollmentAccess(byUser);

    // Fall back: match by email and auto-link userId
    const [userRow] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow?.email) throw new UnauthorizedException('Not enrolled');

    const [byEmail] = await this.db
      .select({ id: liveEnrollments.id, status: liveEnrollments.status, expiresAt: liveEnrollments.expiresAt, paymentMode: liveEnrollments.paymentMode })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.email, userRow.email),
        ),
      )
      .limit(1);

    if (!byEmail) throw new UnauthorizedException('Not enrolled');
    this.checkEnrollmentAccess(byEmail);

    // Auto-link so future checks hit the fast path
    await this.db
      .update(liveEnrollments)
      .set({ userId })
      .where(eq(liveEnrollments.id, byEmail.id));

    return byEmail;
  }

  /** Throws with a distinguishable reason if the enrollment can't currently access the course. */
  private checkEnrollmentAccess(row: { id: number; status: string; expiresAt: Date | null; paymentMode?: string }) {
    if (row.status === 'suspended') throw new ForbiddenException('suspended');
    if (row.expiresAt && row.expiresAt <= new Date()) throw new ForbiddenException('expired');
    if (row.status !== 'completed') throw new UnauthorizedException('Not enrolled');

    // Subscription-specific checks (synchronous subset — full check done via service)
    if (row.paymentMode === 'subscription') {
      // For subscription enrollments, the subscription status is checked at service level
      // Here we just ensure the enrollment itself is valid
    }

    return row;
  }

  /**
   * Non-throwing status check for the student-facing gate page (mirrors
   * EnrollmentsService.getEnrollmentInfo for recorded courses).
   */
  async getLiveEnrollmentInfo(
    liveCourseId: number,
    userId: number,
  ): Promise<{ enrolled: boolean; reason: 'suspended' | 'expired' | 'subscription_expired' | 'subscription_past_due' | null; statusReason?: string | null; expiresAt?: string | null; subscription?: { status: string; monthlyPrice: string; nextBillingDate: Date; canCancel: boolean; canRenew: boolean } | null }> {
    const [userRow] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [row] = await this.db
      .select({ id: liveEnrollments.id, status: liveEnrollments.status, expiresAt: liveEnrollments.expiresAt, statusReason: liveEnrollments.statusReason, paymentMode: liveEnrollments.paymentMode })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          userRow?.email
            ? or(eq(liveEnrollments.userId, userId), eq(liveEnrollments.email, userRow.email))
            : eq(liveEnrollments.userId, userId),
        ),
      )
      .limit(1);

    if (!row) return { enrolled: false, reason: null };
    if (row.status === 'suspended') return { enrolled: false, reason: 'suspended', statusReason: row.statusReason };
    const now = new Date();
    if (row.expiresAt && row.expiresAt <= now) return { enrolled: false, reason: 'expired', expiresAt: row.expiresAt.toISOString() };
    if (row.status !== 'completed') return { enrolled: false, reason: null };

    // Check subscription status for subscription-mode enrollments
    if (row.paymentMode === 'subscription') {
      const [subscription] = await this.db
        .select()
        .from(liveSubscriptions)
        .where(eq(liveSubscriptions.enrollmentId, row.id))
        .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
        .limit(1);

      if (subscription) {
        if (subscription.status === 'expired') {
          return { enrolled: false, reason: 'subscription_expired', subscription: { status: subscription.status, monthlyPrice: subscription.monthlyPrice, nextBillingDate: subscription.nextBillingAt, canCancel: false, canRenew: true } };
        }
        if (subscription.status === 'past_due') {
          const graceEnd = new Date(subscription.nextBillingAt);
          graceEnd.setDate(graceEnd.getDate() + 3);
          if (now > graceEnd) {
            return { enrolled: false, reason: 'subscription_past_due', subscription: { status: subscription.status, monthlyPrice: subscription.monthlyPrice, nextBillingDate: subscription.nextBillingAt, canCancel: false, canRenew: true } };
          }
        }
        if (subscription.status === 'cancelled') {
          if (subscription.nextBillingAt <= now) {
            return { enrolled: false, reason: 'subscription_expired', subscription: { status: subscription.status, monthlyPrice: subscription.monthlyPrice, nextBillingDate: subscription.nextBillingAt, canCancel: false, canRenew: true } };
          }
        }
        return {
          enrolled: true,
          reason: null,
          subscription: {
            status: subscription.status,
            monthlyPrice: subscription.monthlyPrice,
            nextBillingDate: subscription.nextBillingAt,
            canCancel: subscription.status === 'active',
            canRenew: subscription.status === 'past_due' || (subscription.status as string) === 'expired',
          },
        };
      }
    }

    return { enrolled: true, reason: null };
  }

  // ── Modules: CRUD ─────────────────────────────────────────────────────────

  async findModulesByCourse(liveCourseId: number, adminUserId: number, isAdmin = false) {
    await this.assertCanEditLiveCourse(liveCourseId, adminUserId, isAdmin);
    const mods = await this.db
      .select()
      .from(liveCourseModules)
      .where(eq(liveCourseModules.liveCourseId, liveCourseId))
      .orderBy(asc(liveCourseModules.order));

    if (mods.length === 0) return [];

    // Fetch all lessons for these modules in ONE query, then group by module
    // (avoids a per-module round-trip / N+1).
    const moduleIds = mods.map((m) => m.id);
    const allLessons = await this.db
      .select()
      .from(liveCourseLessons)
      .where(inArray(liveCourseLessons.moduleId, moduleIds))
      .orderBy(asc(liveCourseLessons.order));

    // Self-heal Bunny status for any not-yet-ready lesson (webhook may have been
    // missed, e.g. unreachable in local dev) so the builder shows the real state.
    const pending = allLessons.filter(
      (l) => l.videoSource === 'bunny' && l.bunnyVideoId && l.bunnyStatus !== 'ready',
    );
    if (pending.length > 0) {
      await Promise.all(
        pending.map(async (l) => {
          const live = await this.bunny.getVideoStatus(l.bunnyVideoId!);
          if (live.state === l.bunnyStatus) return;
          const updates: Partial<typeof liveCourseLessons.$inferInsert> = {
            bunnyStatus: live.state,
            updatedAt: new Date(),
          };
          if (live.duration) updates.duration = live.duration;
          await this.db.update(liveCourseLessons).set(updates).where(eq(liveCourseLessons.id, l.id));
          l.bunnyStatus = live.state;
          if (live.duration) l.duration = live.duration;
        }),
      );
    }

    const lessonsByModule = new Map<number, typeof allLessons>();
    for (const lesson of allLessons) {
      const list = lessonsByModule.get(lesson.moduleId) ?? [];
      list.push(lesson);
      lessonsByModule.set(lesson.moduleId, list);
    }

    return mods.map((mod) => ({ ...mod, lessons: lessonsByModule.get(mod.id) ?? [] }));
  }

  /** Self-heal + return a single lesson's current Bunny encoding status. Used by
   *  the admin curriculum builder to poll while a video transcodes. */
  async getLessonBunnyStatus(lessonId: number) {
    const [lesson] = await this.db
      .select()
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Lesson not found');

    let status = lesson.bunnyStatus;
    let duration = lesson.duration;
    if (lesson.videoSource === 'bunny' && lesson.bunnyVideoId && status !== 'ready') {
      const live = await this.bunny.getVideoStatus(lesson.bunnyVideoId);
      if (live.state !== status) {
        await this.updateBunnyStatus(lesson.bunnyVideoId, live.state, live.duration || undefined);
        status = live.state;
        if (live.duration) duration = live.duration;
      }
    }
    return { status, duration };
  }

  /** Admin in-builder video preview — signed Bunny iframe or external URL. */
  async getLessonPlayback(lessonId: number) {
    const [lesson] = await this.db
      .select()
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (lesson.videoSource === 'bunny' && lesson.bunnyVideoId) {
      let status = lesson.bunnyStatus;
      if (status !== 'ready') {
        const live = await this.bunny.getVideoStatus(lesson.bunnyVideoId);
        if (live.state !== status) {
          await this.updateBunnyStatus(lesson.bunnyVideoId, live.state, live.duration || undefined);
          status = live.state;
        }
      }
      return {
        source: 'bunny' as const,
        iframeUrl: await this.bunny.getSignedIframeUrl(lesson.bunnyVideoId),
        status,
      };
    }

    if (lesson.videoSource === 'external' && lesson.externalVideoUrl) {
      return { source: 'external' as const, url: lesson.externalVideoUrl };
    }

    throw new NotFoundException('No video source configured for this lesson');
  }

  async createModule(liveCourseId: number, title: string, adminUserId: number, isAdmin = false) {
    await this.assertCanEditLiveCourse(liveCourseId, adminUserId, isAdmin);
    const existing = await this.db
      .select({ id: liveCourseModules.id })
      .from(liveCourseModules)
      .where(eq(liveCourseModules.liveCourseId, liveCourseId));

    const [mod] = await this.db
      .insert(liveCourseModules)
      .values({ liveCourseId, title, order: existing.length })
      .returning();
    return { ...mod, lessons: [] };
  }

  async updateModule(moduleId: number, title: string, adminUserId: number, isAdmin = false) {
    const mod = await this.assertModuleExists(moduleId);
    await this.assertCanEditLiveCourse(mod.liveCourseId, adminUserId, isAdmin);
    const [updated] = await this.db
      .update(liveCourseModules)
      .set({ title, updatedAt: new Date() })
      .where(eq(liveCourseModules.id, moduleId))
      .returning();
    return updated;
  }

  async deleteModule(moduleId: number, adminUserId: number, isAdmin = false) {
    const mod = await this.assertModuleExists(moduleId);
    await this.assertCanEditLiveCourse(mod.liveCourseId, adminUserId, isAdmin);

    // Clean up Bunny videos before cascade
    const vids = await this.db
      .select({ bunnyVideoId: liveCourseLessons.bunnyVideoId })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.moduleId, moduleId));
    await Promise.all(
      vids
        .filter((v) => v.bunnyVideoId)
        .map((v) => this.bunny.deleteVideo(v.bunnyVideoId as string)),
    );

    await this.db.delete(liveCourseModules).where(eq(liveCourseModules.id, moduleId));
    return { deleted: true };
  }

  async reorderModules(liveCourseId: number, order: { id: number; order: number }[], adminUserId: number, isAdmin = false) {
    await this.assertCanEditLiveCourse(liveCourseId, adminUserId, isAdmin);
    await Promise.all(
      order.map(({ id, order: o }) =>
        this.db
          .update(liveCourseModules)
          .set({ order: o, updatedAt: new Date() })
          .where(and(eq(liveCourseModules.id, id), eq(liveCourseModules.liveCourseId, liveCourseId))),
      ),
    );
    return this.findModulesByCourse(liveCourseId, adminUserId, isAdmin);
  }

  // ── Lessons: CRUD ─────────────────────────────────────────────────────────

  async createLesson(moduleId: number, dto: { title: string; type?: 'video' | 'text' | 'quiz' | 'assignment'; content?: string; isFree?: boolean }, adminUserId: number, isAdmin = false) {
    const mod = await this.assertModuleExists(moduleId);
    await this.assertCanEditLiveCourse(mod.liveCourseId, adminUserId, isAdmin);
    const existing = await this.db
      .select({ id: liveCourseLessons.id })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.moduleId, moduleId));

    const [lesson] = await this.db
      .insert(liveCourseLessons)
      .values({
        moduleId,
        liveCourseId: mod.liveCourseId,
        title: dto.title,
        type: dto.type ?? 'video',
        content: dto.content,
        isFree: dto.isFree ?? false,
        order: existing.length,
      })
      .returning();
    return lesson;
  }

  async updateLesson(lessonId: number, dto: {
    title?: string;
    type?: 'video' | 'text';
    content?: string;
    isFree?: boolean;
    order?: number;
    videoSource?: 'bunny' | 'external';
    bunnyVideoId?: string;
    bunnyStatus?: 'processing' | 'ready' | 'failed';
    externalVideoUrl?: string;
    duration?: number;
  }, adminUserId: number, isAdmin = false) {
    const lesson = await this.assertLessonExists(lessonId);
    await this.assertCanEditLiveCourse(lesson.liveCourseId, adminUserId, isAdmin);

    const updates: Partial<typeof liveCourseLessons.$inferInsert> = {};
    if (dto.title            !== undefined) updates.title            = dto.title;
    if (dto.type             !== undefined) updates.type             = dto.type;
    if (dto.content          !== undefined) updates.content          = dto.content;
    if (dto.isFree           !== undefined) updates.isFree           = dto.isFree;
    if (dto.order            !== undefined) updates.order            = dto.order;
    if (dto.videoSource      !== undefined) updates.videoSource      = dto.videoSource;
    if (dto.bunnyVideoId     !== undefined) updates.bunnyVideoId     = dto.bunnyVideoId;
    if (dto.bunnyStatus      !== undefined) updates.bunnyStatus      = dto.bunnyStatus;
    if (dto.externalVideoUrl !== undefined) updates.externalVideoUrl = dto.externalVideoUrl;
    if (dto.duration         !== undefined) updates.duration         = dto.duration;
    updates.updatedAt = new Date();

    const [updated] = await this.db
      .update(liveCourseLessons)
      .set(updates)
      .where(eq(liveCourseLessons.id, lessonId))
      .returning();
    return updated;
  }

  async deleteLesson(lessonId: number, adminUserId: number, isAdmin = false) {
    const lesson = await this.assertLessonExists(lessonId);
    await this.assertCanEditLiveCourse(lesson.liveCourseId, adminUserId, isAdmin);
    if (lesson.bunnyVideoId) await this.bunny.deleteVideo(lesson.bunnyVideoId);
    await this.db.delete(liveCourseLessons).where(eq(liveCourseLessons.id, lessonId));
    return { deleted: true };
  }

  async reorderLessons(moduleId: number, order: { id: number; order: number }[], adminUserId: number, isAdmin = false) {
    const mod = await this.assertModuleExists(moduleId);
    await this.assertCanEditLiveCourse(mod.liveCourseId, adminUserId, isAdmin);
    await Promise.all(
      order.map(({ id, order: o }) =>
        this.db
          .update(liveCourseLessons)
          .set({ order: o, updatedAt: new Date() })
          .where(and(eq(liveCourseLessons.id, id), eq(liveCourseLessons.moduleId, moduleId))),
      ),
    );
    return this.db
      .select()
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.moduleId, moduleId))
      .orderBy(asc(liveCourseLessons.order));
  }

  // ── Bunny video upload ────────────────────────────────────────────────────

  async getBunnyUploadCredentials(lessonId: number, adminUserId: number, isAdmin = false) {
    const lesson = await this.assertLessonExists(lessonId);
    await this.assertCanEditLiveCourse(lesson.liveCourseId, adminUserId, isAdmin);
    if (lesson.bunnyVideoId) await this.bunny.deleteVideo(lesson.bunnyVideoId);

    const videoId = await this.bunny.createVideo(lesson.title);
    await this.db
      .update(liveCourseLessons)
      .set({ videoSource: 'bunny', bunnyVideoId: videoId, bunnyStatus: 'processing', externalVideoUrl: null, updatedAt: new Date() })
      .where(eq(liveCourseLessons.id, lessonId));

    return { ...(await this.bunny.getTusCredentials(videoId)), title: lesson.title };
  }

  async setExternalUrl(lessonId: number, url: string, duration: number | undefined, adminUserId: number, isAdmin = false) {
    const lesson = await this.assertLessonExists(lessonId);
    await this.assertCanEditLiveCourse(lesson.liveCourseId, adminUserId, isAdmin);
    if (lesson.bunnyVideoId) await this.bunny.deleteVideo(lesson.bunnyVideoId);

    const [updated] = await this.db
      .update(liveCourseLessons)
      .set({
        videoSource: 'external',
        externalVideoUrl: url,
        bunnyVideoId: null,
        bunnyStatus: null,
        ...(duration !== undefined ? { duration } : {}),
        updatedAt: new Date(),
      })
      .where(eq(liveCourseLessons.id, lessonId))
      .returning();
    return updated;
  }

  async updateBunnyStatus(videoId: string, status: 'processing' | 'ready' | 'failed', duration?: number) {
    const updates: Partial<typeof liveCourseLessons.$inferInsert> = { bunnyStatus: status, updatedAt: new Date() };
    if (duration !== undefined) updates.duration = duration;
    await this.db.update(liveCourseLessons).set(updates).where(eq(liveCourseLessons.bunnyVideoId, videoId));
  }

  // ── Student: enrollment-gated curriculum + playback ───────────────────────

  async getEnrollmentStatus(liveCourseId: number, userId: number) {
    const info = await this.getLiveEnrollmentInfo(liveCourseId, userId);
    if (!info.enrolled) return { ...info, courseCompleted: false };
    const courseCompleted = await this.isAllLessonsCompleted(liveCourseId, userId);
    return { ...info, courseCompleted };
  }

  private async isAllLessonsCompleted(liveCourseId: number, userId: number): Promise<boolean> {
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
    return total > 0 && completed >= total;
  }

  /** All live-course ids the user is enrolled in (by user id OR account email),
   *  for marking listing cards as "Enrolled". One query, not one-per-card. */
  async getMyEnrolledCourseIds(userId: number): Promise<{ courseIds: number[] }> {
    const [userRow] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const email = userRow?.email ?? null;

    const rows = await this.db
      .select({ liveCourseId: liveEnrollments.liveCourseId })
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.status, 'completed'),
          email
            ? or(eq(liveEnrollments.userId, userId), eq(liveEnrollments.email, email))
            : eq(liveEnrollments.userId, userId),
        ),
      );

    return { courseIds: [...new Set(rows.map((r) => r.liveCourseId))] };
  }

  async getCurriculum(liveCourseId: number, userId: number) {
    await this.assertEnrolled(liveCourseId, userId);

    const mods = await this.db
      .select()
      .from(liveCourseModules)
      .where(eq(liveCourseModules.liveCourseId, liveCourseId))
      .orderBy(asc(liveCourseModules.order));

    if (mods.length === 0) return [];

    const moduleIds = mods.map((m) => m.id);
    const allLessons = await this.db
      .select()
      .from(liveCourseLessons)
      .where(inArray(liveCourseLessons.moduleId, moduleIds))
      .orderBy(asc(liveCourseLessons.order));

    const progressRows = await this.db
      .select()
      .from(liveLessonProgress)
      .where(
        and(
          eq(liveLessonProgress.userId, userId),
          eq(liveLessonProgress.liveCourseId, liveCourseId),
        ),
      );

    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));
    const lessonsByModule = new Map<number, typeof allLessons>();
    for (const lesson of allLessons) {
      const arr = lessonsByModule.get(lesson.moduleId) ?? [];
      arr.push(lesson);
      lessonsByModule.set(lesson.moduleId, arr);
    }

    // Sequential lock — same algorithm as recorded courses. Every lesson is
    // locked until all prior lessons are completed; free previews are exempt.
    const lockedIds = new Set<number>();
    let allPreviousDone = true;
    for (const mod of mods) {
      for (const lesson of lessonsByModule.get(mod.id) ?? []) {
        if (lesson.isFree) continue;
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

  async markLessonComplete(lessonId: number, userId: number) {
    const [lesson] = await this.db
      .select({ liveCourseId: liveCourseLessons.liveCourseId })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);

    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertEnrolled(lesson.liveCourseId, userId);

    const [row] = await this.db
      .insert(liveLessonProgress)
      .values({
        userId,
        lessonId,
        liveCourseId: lesson.liveCourseId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [liveLessonProgress.userId, liveLessonProgress.lessonId],
        set: { completedAt: new Date(), updatedAt: new Date() },
      })
      .returning();

    const courseCompleted = await this.isAllLessonsCompleted(lesson.liveCourseId, userId);

    let certificate: typeof liveCertificates.$inferSelect | null = null;
    if (courseCompleted) {
      try {
        const [existing] = await this.db
          .select()
          .from(liveCertificates)
          .where(and(eq(liveCertificates.userId, userId), eq(liveCertificates.liveCourseId, lesson.liveCourseId)))
          .limit(1);

        if (existing) {
          certificate = existing;
        } else {
          const [cert] = await this.db
            .insert(liveCertificates)
            .values({ userId, liveCourseId: lesson.liveCourseId, certificateCode: await this.generateCertCode() })
            .onConflictDoNothing()
            .returning();
          certificate = cert ?? null;
        }
      } catch (err) {
        this.logger.error(`Auto-issue live certificate failed (user ${userId}, course ${lesson.liveCourseId})`, err as Error);
      }
    }

    return { ...row, courseCompleted, certificate };
  }

  /** Public enrollment gate reused by sibling services (e.g. assessments). */
  async ensureEnrolled(liveCourseId: number, userId: number) {
    await this.assertEnrolled(liveCourseId, userId);
  }

  async getPlaybackInfo(lessonId: number, userId: number) {
    const lesson = await this.assertLessonExists(lessonId);

    // Live lesson playback is enrolled-students only. There is no public
    // free-preview path into the learn area, so we never bypass on isFree.
    await this.assertEnrolled(lesson.liveCourseId, userId);

    if (lesson.videoSource === 'bunny' && lesson.bunnyVideoId) {
      let status = lesson.bunnyStatus;
      if (status !== 'ready') {
        const live = await this.bunny.getVideoStatus(lesson.bunnyVideoId);
        if (live.state !== status) {
          await this.updateBunnyStatus(lesson.bunnyVideoId, live.state, live.duration || undefined);
          status = live.state;
        }
      }
      return { source: 'bunny' as const, iframeUrl: await this.bunny.getSignedIframeUrl(lesson.bunnyVideoId), status };
    }

    if (lesson.videoSource === 'external' && lesson.externalVideoUrl) {
      return { source: 'external' as const, url: lesson.externalVideoUrl };
    }

    throw new NotFoundException('No video source configured for this lesson');
  }

  // ─── Live lesson notes ────────────────────────────────────────────────────────

  async createNote(userId: number, lessonId: number, content: string, videoTimestamp = 0) {
    const [lesson] = await this.db
      .select({ liveCourseId: liveCourseLessons.liveCourseId })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertEnrolled(lesson.liveCourseId, userId);

    const [note] = await this.db
      .insert(liveNotes)
      .values({ userId, lessonId, content, videoTimestamp, updatedAt: new Date() })
      .returning();
    return note;
  }

  async listNotes(userId: number, lessonId: number) {
    const [lesson] = await this.db
      .select({ liveCourseId: liveCourseLessons.liveCourseId })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertEnrolled(lesson.liveCourseId, userId);

    return this.db
      .select()
      .from(liveNotes)
      .where(and(eq(liveNotes.userId, userId), eq(liveNotes.lessonId, lessonId)))
      .orderBy(sql`${liveNotes.createdAt} DESC`);
  }

  async updateNote(userId: number, noteId: number, content: string) {
    const [note] = await this.db
      .select()
      .from(liveNotes)
      .where(eq(liveNotes.id, noteId))
      .limit(1);
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();

    const [updated] = await this.db
      .update(liveNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(liveNotes.id, noteId))
      .returning();

    return updated;
  }

  async removeNote(userId: number, noteId: number) {
    const [note] = await this.db
      .select()
      .from(liveNotes)
      .where(eq(liveNotes.id, noteId))
      .limit(1);
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();
    await this.db.delete(liveNotes).where(eq(liveNotes.id, noteId));
  }
}
