import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { banners } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

type BannerInput = {
  placement: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  openInNewTab?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

@Injectable()
export class BannersService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Public — active banners within their schedule window, grouped by placement. */
  async getPublicGrouped() {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          or(isNull(banners.startsAt), lte(banners.startsAt, now)),
          or(isNull(banners.endsAt), gte(banners.endsAt, now)),
        ),
      )
      .orderBy(asc(banners.order));

    return {
      popup: rows.filter((r) => r.placement === 'popup'),
      top_strip: rows.filter((r) => r.placement === 'top_strip'),
    };
  }

  /** Admin — every banner, grouped by placement. */
  async getAdminGrouped() {
    const rows = await this.db.select().from(banners).orderBy(asc(banners.order));
    return {
      popup: rows.filter((r) => r.placement === 'popup'),
      top_strip: rows.filter((r) => r.placement === 'top_strip'),
    };
  }

  async create(data: BannerInput) {
    const siblings = await this.db
      .select({ order: banners.order })
      .from(banners)
      .where(eq(banners.placement, data.placement));
    const nextOrder = siblings.reduce((max, s) => Math.max(max, s.order + 1), 0);

    const [row] = await this.db
      .insert(banners)
      .values({
        placement: data.placement,
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl ?? null,
        openInNewTab: data.openInNewTab ?? false,
        isActive: data.isActive ?? true,
        order: nextOrder,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      })
      .returning();
    this.revalidation.revalidate([CacheTag.banners]);
    return row;
  }

  async update(id: number, data: Partial<BannerInput>) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) patch.linkUrl = data.linkUrl;
    if (data.openInNewTab !== undefined) patch.openInNewTab = data.openInNewTab;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.startsAt !== undefined) patch.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) patch.endsAt = data.endsAt ? new Date(data.endsAt) : null;

    const [row] = await this.db
      .update(banners)
      .set(patch)
      .where(eq(banners.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.banners]);
    return row;
  }

  async toggle(id: number) {
    const [existing] = await this.db
      .select()
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);
    if (!existing) return null;
    const [row] = await this.db
      .update(banners)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.banners]);
    return row;
  }

  async reorder(items: { id: number; order: number }[]) {
    for (const { id, order } of items) {
      await this.db
        .update(banners)
        .set({ order, updatedAt: new Date() })
        .where(eq(banners.id, id));
    }
    this.revalidation.revalidate([CacheTag.banners]);
  }

  async delete(id: number) {
    await this.db.delete(banners).where(eq(banners.id, id));
    this.revalidation.revalidate([CacheTag.banners]);
  }
}
