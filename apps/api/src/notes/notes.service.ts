import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  courseModules,
  courses,
  enrollments,
  lessons,
  liveCourseLessons,
  liveCourseModules,
  liveCourses,
  liveNotes,
  notes,
} from 'src/db/schema';

export interface AllNotesEntry {
  id: number;
  source: 'recorded' | 'live';
  content: string;
  createdAt: Date | null;
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  courseHref: string;
}

@Injectable()
export class NotesService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  private async assertEnrolled(userId: number, lessonId: number) {
    const [row] = await this.db
      .select({ courseId: courseModules.courseId })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!row) throw new NotFoundException('Lesson not found');

    const [enrollment] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, row.courseId),
          inArray(enrollments.status, ['active', 'completed']),
        ),
      )
      .limit(1);

    if (!enrollment) throw new ForbiddenException('Not enrolled');
  }

  async create(userId: number, lessonId: number, content: string, videoTimestamp = 0) {
    await this.assertEnrolled(userId, lessonId);

    const [note] = await this.db
      .insert(notes)
      .values({ userId, lessonId, content, videoTimestamp, updatedAt: new Date() })
      .returning();

    return note;
  }

  async findByLesson(userId: number, lessonId: number) {
    await this.assertEnrolled(userId, lessonId);

    return this.db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
      .orderBy(desc(notes.createdAt));
  }

  async findAllForUser(userId: number): Promise<AllNotesEntry[]> {
    const recorded = await this.db
      .select({
        id: notes.id,
        content: notes.content,
        createdAt: notes.createdAt,
        lessonId: notes.lessonId,
        lessonTitle: lessons.title,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(notes)
      .innerJoin(lessons, eq(notes.lessonId, lessons.id))
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .innerJoin(courses, eq(courseModules.courseId, courses.id))
      .where(eq(notes.userId, userId));

    const live = await this.db
      .select({
        id: liveNotes.id,
        content: liveNotes.content,
        createdAt: liveNotes.createdAt,
        lessonId: liveNotes.lessonId,
        lessonTitle: liveCourseLessons.title,
        courseTitle: liveCourses.title,
        liveCourseId: liveCourses.id,
      })
      .from(liveNotes)
      .innerJoin(liveCourseLessons, eq(liveNotes.lessonId, liveCourseLessons.id))
      .innerJoin(liveCourseModules, eq(liveCourseLessons.moduleId, liveCourseModules.id))
      .innerJoin(liveCourses, eq(liveCourseModules.liveCourseId, liveCourses.id))
      .where(eq(liveNotes.userId, userId));

    const entries: AllNotesEntry[] = [
      ...recorded.map((n) => ({
        id: n.id,
        source: 'recorded' as const,
        content: n.content,
        createdAt: n.createdAt,
        lessonId: n.lessonId,
        lessonTitle: n.lessonTitle,
        courseTitle: n.courseTitle,
        courseHref: `/learn/${n.courseSlug}/${n.lessonId}`,
      })),
      ...live.map((n) => ({
        id: n.id,
        source: 'live' as const,
        content: n.content,
        createdAt: n.createdAt,
        lessonId: n.lessonId,
        lessonTitle: n.lessonTitle,
        courseTitle: n.courseTitle,
        courseHref: `/c/${n.liveCourseId}/learn/${n.lessonId}`,
      })),
    ];

    return entries.sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }

  async update(userId: number, noteId: number, content: string) {
    const [note] = await this.db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();

    const [updated] = await this.db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning();

    return updated;
  }

  async remove(userId: number, noteId: number) {
    const [note] = await this.db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();

    await this.db.delete(notes).where(eq(notes.id, noteId));
  }
}
