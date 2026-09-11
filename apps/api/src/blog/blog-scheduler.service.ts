import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte } from 'drizzle-orm';
import type { DB } from 'src/db';
import { blogPosts } from '../db/schema';
import { DB_TOKEN } from '../db/db.module';
import { RevalidationService } from '../common/revalidation/revalidation.service';
import { CacheTag, blogTags } from '../common/revalidation/cache-tags';

@Injectable()
export class BlogSchedulerService {
  private readonly logger = new Logger(BlogSchedulerService.name);

  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /**
   * Every minute, check for scheduled blog posts whose publishAt has arrived.
   * Promote them to 'published' with publishedAt = now.
   * Pattern matches CoursesSchedulerService.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledPosts() {
    const now = new Date();

    const published = await this.db
      .update(blogPosts)
      .set({ status: 'published', publishedAt: now, publishAt: null })
      .where(and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.publishAt, now)))
      .returning({ id: blogPosts.id, slug: blogPosts.slug });

    if (published.length === 0) return;

    this.logger.log(`Auto-published ${published.length} scheduled blog post(s)`);

    // Revalidate each post + the blog listing
    for (const post of published) {
      this.revalidation.revalidate(blogTags(post.slug));
    }
    this.revalidation.revalidate([CacheTag.blog]);
  }
}
