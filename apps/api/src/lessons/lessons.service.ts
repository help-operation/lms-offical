import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  courseModules,
  courses,
  enrollments,
  lessons,
} from 'src/db/schema';
import { BunnyStreamService } from 'src/bunny-stream/bunny-stream.service';
import { canEditCourse } from 'src/common/rbac/course-access';
import type {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
} from './dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bunny: BunnyStreamService,
  ) {}

  // ── Ownership guards ─────────────────────────────────────────────────────────

  private async assertModuleOwner(moduleId: number, instructorId: number, isAdmin = false) {
    const [mod] = await this.db
      .select({ id: courseModules.id, courseId: courseModules.courseId })
      .from(courseModules)
      .where(eq(courseModules.id, moduleId))
      .limit(1);

    if (!mod) throw new NotFoundException('Module not found');

    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, mod.courseId))
      .limit(1);

    if (!course || !(await canEditCourse(this.db, mod.courseId, course.instructorId, instructorId, isAdmin))) {
      throw new ForbiddenException('Access denied');
    }
    return mod;
  }

  private async assertLessonOwner(lessonId: number, instructorId: number, isAdmin = false) {
    const [lesson] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertModuleOwner(lesson.moduleId, instructorId, isAdmin);
    return lesson;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async findByModule(moduleId: number) {
    return this.db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.order));
  }

  async create(moduleId: number, instructorId: number, dto: CreateLessonDto, isAdmin = false) {
    const mod = await this.assertModuleOwner(moduleId, instructorId, isAdmin);

    const existing = await this.findByModule(moduleId);
    const order = dto.order ?? existing.length;

    const [lesson] = await this.db
      .insert(lessons)
      .values({
        moduleId,
        title: dto.title,
        type: dto.type ?? 'video',
        content: dto.content,
        isFree: dto.isFree ?? false,
        order,
      })
      .returning();

    // A new lesson means the course is no longer 100% complete for anyone.
    // Reset 'completed' enrollments → 'active' so those students see "Continue"
    // and can watch the new lesson before the certificate banner reappears.
    await this.db
      .update(enrollments)
      .set({ status: 'active', completedAt: null })
      .where(
        and(
          eq(enrollments.courseId, mod.courseId),
          eq(enrollments.status, 'completed'),
        ),
      );

    return lesson;
  }

  async update(lessonId: number, instructorId: number, dto: UpdateLessonDto, isAdmin = false) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);

    const updates: Partial<typeof lessons.$inferInsert> = {};
    if (dto.title !== undefined)           updates.title = dto.title;
    if (dto.type !== undefined)            updates.type = dto.type;
    if (dto.content !== undefined)         updates.content = dto.content;
    if (dto.isFree !== undefined)          updates.isFree = dto.isFree;
    if (dto.order !== undefined)           updates.order = dto.order;
    if (dto.videoSource !== undefined)     updates.videoSource = dto.videoSource;
    if (dto.bunnyVideoId !== undefined)    updates.bunnyVideoId = dto.bunnyVideoId;
    if (dto.bunnyStatus !== undefined)     updates.bunnyStatus = dto.bunnyStatus;
    if (dto.externalVideoUrl !== undefined) updates.externalVideoUrl = dto.externalVideoUrl;
    if (dto.duration !== undefined)        updates.duration = dto.duration;
    updates.updatedAt = new Date();

    const [updated] = await this.db
      .update(lessons)
      .set(updates)
      .where(eq(lessons.id, lessonId))
      .returning();

    return updated;
  }

  async remove(lessonId: number, instructorId: number, isAdmin = false) {
    const lesson = await this.assertLessonOwner(lessonId, instructorId, isAdmin);

    // Clean up Bunny video if it exists
    if (lesson.bunnyVideoId) {
      await this.bunny.deleteVideo(lesson.bunnyVideoId);
    }

    await this.db.delete(lessons).where(eq(lessons.id, lessonId));
    return { deleted: true };
  }

  async reorder(moduleId: number, instructorId: number, dto: ReorderLessonsDto, isAdmin = false) {
    await this.assertModuleOwner(moduleId, instructorId, isAdmin);

    await Promise.all(
      dto.order.map(({ id, order }) =>
        this.db
          .update(lessons)
          .set({ order, updatedAt: new Date() })
          .where(and(eq(lessons.id, id), eq(lessons.moduleId, moduleId))),
      ),
    );

    return this.findByModule(moduleId);
  }

  // ── Bunny Stream — upload credentials ────────────────────────────────────────
  // Creates a video entry on Bunny, saves the videoId, returns TUS credentials
  // for the browser to upload directly (no API key exposed).

  async getBunnyUploadCredentials(lessonId: number, instructorId: number, isAdmin = false) {
    const lesson = await this.assertLessonOwner(lessonId, instructorId, isAdmin);

    // If there's an existing Bunny video, delete it before creating a new one
    if (lesson.bunnyVideoId) {
      await this.bunny.deleteVideo(lesson.bunnyVideoId);
    }

    const videoId = await this.bunny.createVideo(lesson.title);

    // Save videoId + mark as processing
    await this.db
      .update(lessons)
      .set({
        videoSource: 'bunny',
        bunnyVideoId: videoId,
        bunnyStatus: 'processing',
        externalVideoUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId));

    // Include the lesson title so the browser sets it as the TUS upload
    // title (otherwise tus-js-client defaults it to the file name).
    return { ...(await this.bunny.getTusCredentials(videoId)), title: lesson.title };
  }

  // ── External video URL ────────────────────────────────────────────────────────

  async setExternalUrl(lessonId: number, instructorId: number, url: string, isAdmin = false, duration?: number) {
    const lesson = await this.assertLessonOwner(lessonId, instructorId, isAdmin);

    // Clean up any existing Bunny video
    if (lesson.bunnyVideoId) {
      await this.bunny.deleteVideo(lesson.bunnyVideoId);
    }

    const [updated] = await this.db
      .update(lessons)
      .set({
        videoSource: 'external',
        externalVideoUrl: url,
        bunnyVideoId: null,
        bunnyStatus: null,
        ...(duration !== undefined ? { duration } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId))
      .returning();

    return updated;
  }

  // ── Playback info — enrollment gated ─────────────────────────────────────────
  // Returns signed Bunny iframe URL or external URL, only for enrolled students.

  async getPlaybackInfo(lessonId: number, userId: number) {
    const [lesson] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) throw new NotFoundException('Lesson not found');

    // Get courseId via module
    const [mod] = await this.db
      .select({ courseId: courseModules.courseId })
      .from(courseModules)
      .where(eq(courseModules.id, lesson.moduleId))
      .limit(1);

    if (!mod) throw new NotFoundException('Module not found');

    // Free lessons are accessible without enrollment
    if (!lesson.isFree) {
      const [enrollment] = await this.db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, userId),
            eq(enrollments.courseId, mod.courseId),
            inArray(enrollments.status, ['active', 'completed']),
          ),
        )
        .limit(1);

      if (!enrollment) {
        throw new UnauthorizedException('You must be enrolled to watch this lesson');
      }
    }

    return this.resolvePlayback(lesson);
  }

  // ── Admin/instructor playback — no enrollment check ─────────────────────────
  async getAdminPlayback(lessonId: number) {
    const [lesson] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.resolvePlayback(lesson);
  }

  // ── Public free-lesson preview ───────────────────────────────────────────────
  // No auth / no enrollment — but only ever returns video for lessons explicitly
  // marked `isFree`, so paid-lesson sources can never leak via this route.
  async getFreePreview(lessonId: number) {
    const [lesson] = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) throw new NotFoundException('Lesson not found');
    if (!lesson.isFree) {
      throw new ForbiddenException('This lesson is not available for free preview');
    }

    return this.resolvePlayback(lesson);
  }

  // Build the playback payload (signed Bunny iframe or external URL) for a lesson
  // row. Shared by enrollment-gated playback and the public free preview.
  private async resolvePlayback(lesson: typeof lessons.$inferSelect) {
    if (lesson.videoSource === 'bunny' && lesson.bunnyVideoId) {
      let status: 'processing' | 'ready' | 'failed' | null = lesson.bunnyStatus;
      let duration = lesson.duration ?? undefined;

      // Self-heal: if not already 'ready', the encoding webhook may have been
      // missed — ask Bunny directly and persist the real state.
      if (status !== 'ready') {
        const live = await this.bunny.getVideoStatus(lesson.bunnyVideoId);
        if (live.state !== status) {
          await this.updateBunnyStatus(
            lesson.bunnyVideoId,
            live.state,
            live.duration || undefined,
          );
          status = live.state;
        }
        if (live.duration) duration = live.duration;
      }

      return {
        source: 'bunny' as const,
        iframeUrl: await this.bunny.getSignedIframeUrl(lesson.bunnyVideoId),
        status,
        duration,
      };
    }

    if (lesson.videoSource === 'external' && lesson.externalVideoUrl) {
      return {
        source: 'external' as const,
        url: lesson.externalVideoUrl,
      };
    }

    throw new NotFoundException('No video source configured for this lesson');
  }

  // ── Bunny webhook — called when Bunny finishes encoding ──────────────────────

  async updateBunnyStatus(
    videoId: string,
    status: 'processing' | 'ready' | 'failed',
    duration?: number,
  ) {
    const updates: Partial<typeof lessons.$inferInsert> = {
      bunnyStatus: status,
      updatedAt: new Date(),
    };
    if (duration !== undefined) updates.duration = duration;

    await this.db
      .update(lessons)
      .set(updates)
      .where(eq(lessons.bunnyVideoId, videoId));
  }
}
