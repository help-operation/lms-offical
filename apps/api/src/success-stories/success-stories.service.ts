import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { successStories } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

type StoryInput = {
  name: string;
  batch: string;
  category: string;
  image?: string;
  videoUrl?: string | null;
  isActive?: boolean;
};

@Injectable()
export class SuccessStoriesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Public — active stories ordered by `order`. */
  async getPublic() {
    return this.db
      .select()
      .from(successStories)
      .where(eq(successStories.isActive, true))
      .orderBy(asc(successStories.order));
  }

  /** Admin — all stories. */
  async getAll() {
    return this.db
      .select()
      .from(successStories)
      .orderBy(asc(successStories.order));
  }

  async create(data: StoryInput) {
    const all = await this.db.select({ order: successStories.order }).from(successStories);
    const nextOrder = all.reduce((max, s) => Math.max(max, s.order + 1), 0);

    const [row] = await this.db
      .insert(successStories)
      .values({
        name:     data.name,
        batch:    data.batch,
        category: data.category,
        image:    data.image    ?? '',
        videoUrl: data.videoUrl ?? null,
        isActive: data.isActive ?? true,
        order:    nextOrder,
      })
      .returning();
    this.revalidation.revalidate([CacheTag.successStories]);
    return row;
  }

  async update(id: number, data: Partial<StoryInput>) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name      !== undefined) patch.name      = data.name;
    if (data.batch     !== undefined) patch.batch     = data.batch;
    if (data.category  !== undefined) patch.category  = data.category;
    if (data.image     !== undefined) patch.image     = data.image;
    if (data.videoUrl  !== undefined) patch.videoUrl  = data.videoUrl;
    if (data.isActive  !== undefined) patch.isActive  = data.isActive;

    const [row] = await this.db
      .update(successStories)
      .set(patch)
      .where(eq(successStories.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.successStories]);
    return row;
  }

  async toggle(id: number) {
    const [existing] = await this.db
      .select()
      .from(successStories)
      .where(eq(successStories.id, id))
      .limit(1);
    if (!existing) return null;

    const [row] = await this.db
      .update(successStories)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(successStories.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.successStories]);
    return row;
  }

  async reorder(items: { id: number; order: number }[]) {
    for (const { id, order } of items) {
      await this.db
        .update(successStories)
        .set({ order, updatedAt: new Date() })
        .where(eq(successStories.id, id));
    }
    this.revalidation.revalidate([CacheTag.successStories]);
  }

  async delete(id: number) {
    await this.db.delete(successStories).where(eq(successStories.id, id));
    this.revalidation.revalidate([CacheTag.successStories]);
  }
}
