import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { courseModules, courses, lessons } from 'src/db/schema';
import { BunnyStreamService } from 'src/bunny-stream/bunny-stream.service';
import { canEditCourse } from 'src/common/rbac/course-access';
import type {
  CreateModuleDto,
  ReorderModulesDto,
  UpdateModuleDto,
} from './dto/module.dto';

@Injectable()
export class CourseModulesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly bunny: BunnyStreamService,
  ) {}

  private async assertCourseOwner(courseId: number, instructorId: number, isAdmin = false) {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (!course) throw new ForbiddenException('Course not found or access denied');
    if (!(await canEditCourse(this.db, courseId, course.instructorId, instructorId, isAdmin))) {
      throw new ForbiddenException('Course not found or access denied');
    }
    return course;
  }

  private async assertModuleOwner(moduleId: number, instructorId: number, isAdmin = false) {
    const [mod] = await this.db
      .select({ id: courseModules.id, courseId: courseModules.courseId })
      .from(courseModules)
      .where(eq(courseModules.id, moduleId))
      .limit(1);

    if (!mod) throw new NotFoundException('Module not found');
    await this.assertCourseOwner(mod.courseId, instructorId, isAdmin);
    return mod;
  }

  async findByCourse(courseId: number) {
    return this.db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));
  }

  async findByCourseWithLessons(courseId: number) {
    const mods = await this.findByCourse(courseId);
    if (mods.length === 0) return [];

    // Fetch all lessons for these modules in ONE query, then group by module
    // (avoids a per-module round-trip / N+1).
    const moduleIds = mods.map((m) => m.id);
    const allLessons = await this.db
      .select()
      .from(lessons)
      .where(inArray(lessons.moduleId, moduleIds))
      .orderBy(asc(lessons.order));

    const lessonsByModule = new Map<number, typeof allLessons>();
    for (const lesson of allLessons) {
      const list = lessonsByModule.get(lesson.moduleId) ?? [];
      list.push(lesson);
      lessonsByModule.set(lesson.moduleId, list);
    }

    return mods.map((mod) => ({ ...mod, lessons: lessonsByModule.get(mod.id) ?? [] }));
  }

  async create(courseId: number, instructorId: number, dto: CreateModuleDto, isAdmin = false) {
    await this.assertCourseOwner(courseId, instructorId, isAdmin);

    const existing = await this.findByCourse(courseId);
    const order = dto.order ?? existing.length;

    const [mod] = await this.db
      .insert(courseModules)
      .values({ courseId, title: dto.title, order })
      .returning();

    return mod;
  }

  async update(moduleId: number, instructorId: number, dto: UpdateModuleDto, isAdmin = false) {
    await this.assertModuleOwner(moduleId, instructorId, isAdmin);

    const updates: Partial<typeof courseModules.$inferInsert> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.order !== undefined) updates.order = dto.order;
    updates.updatedAt = new Date();

    const [updated] = await this.db
      .update(courseModules)
      .set(updates)
      .where(eq(courseModules.id, moduleId))
      .returning();

    return updated;
  }

  async remove(moduleId: number, instructorId: number, isAdmin = false) {
    await this.assertModuleOwner(moduleId, instructorId, isAdmin);

    // Clean up Bunny videos of all lessons in this module before the DB
    // cascade removes the lesson rows (otherwise they'd be orphaned).
    const vids = await this.db
      .select({ bunnyVideoId: lessons.bunnyVideoId })
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId));
    await Promise.all(
      vids
        .filter((v) => v.bunnyVideoId)
        .map((v) => this.bunny.deleteVideo(v.bunnyVideoId as string)),
    );

    await this.db.delete(courseModules).where(eq(courseModules.id, moduleId));
    return { deleted: true };
  }

  async reorder(courseId: number, instructorId: number, dto: ReorderModulesDto, isAdmin = false) {
    await this.assertCourseOwner(courseId, instructorId, isAdmin);

    await Promise.all(
      dto.order.map(({ id, order }) =>
        this.db
          .update(courseModules)
          .set({ order })
          .where(and(eq(courseModules.id, id), eq(courseModules.courseId, courseId))),
      ),
    );

    return this.findByCourse(courseId);
  }
}
