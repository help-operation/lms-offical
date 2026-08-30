import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { courses, liveCourses } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

/**
 * Auto-publishes courses (recorded + live) whose scheduled publishAt has
 * passed. Runs every minute — cheap no-op query when nothing is due.
 */
@Injectable()
export class CoursesSchedulerService {
  private readonly logger = new Logger(CoursesSchedulerService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledCourses() {
    const now = new Date();

    const [publishedCourses, publishedLive] = await Promise.all([
      this.db
        .update(courses)
        .set({ status: 'published', updatedAt: now })
        .where(and(eq(courses.status, 'scheduled'), lte(courses.publishAt, now)))
        .returning({ id: courses.id }),
      this.db
        .update(liveCourses)
        .set({ status: 'published', updatedAt: now })
        .where(and(eq(liveCourses.status, 'scheduled'), lte(liveCourses.publishAt, now)))
        .returning({ id: liveCourses.id }),
    ]);

    if (publishedCourses.length === 0 && publishedLive.length === 0) return;

    this.logger.log(
      `Auto-published ${publishedCourses.length} course(s), ${publishedLive.length} live course(s) on schedule`,
    );
    this.revalidation.revalidate([CacheTag.courses]);
  }
}
