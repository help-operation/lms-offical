import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { sitePages } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { pageTags } from 'src/common/revalidation/cache-tags';

const DEFAULT_PAGES = [
  { slug: 'privacy-policy',   title: 'Privacy Policy' },
  { slug: 'return-policy',    title: 'Return Policy' },
  { slug: 'terms-conditions', title: 'Terms & Conditions' },
];

@Injectable()
export class PagesService implements OnModuleInit {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  // Seed default pages on startup if they don't exist yet
  async onModuleInit() {
    for (const page of DEFAULT_PAGES) {
      const existing = await this.db
        .select()
        .from(sitePages)
        .where(eq(sitePages.slug, page.slug))
        .limit(1);

      if (!existing[0]) {
        await this.db.insert(sitePages).values({ ...page, content: '' });
      }
    }
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .limit(1);

    if (!result[0]) throw new NotFoundException(`Page "${slug}" not found`);
    return result[0];
  }

  async update(slug: string, content: string) {
    const existing = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .limit(1);

    if (!existing[0]) throw new NotFoundException(`Page "${slug}" not found`);

    const result = await this.db
      .update(sitePages)
      .set({ content, updatedAt: new Date() })
      .where(eq(sitePages.slug, slug))
      .returning();

    this.revalidation.revalidate(pageTags(slug));
    return result[0];
  }
}
