import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { menuItems } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';

/** The four fixed menu slots. */
export const MENU_KEYS = [
  'navbar',
  'navbar_more',
  'footer_company',
  'footer_others',
] as const;
export type MenuKey = (typeof MENU_KEYS)[number];

type SeedItem = { label: string; url: string };

/**
 * Default links — mirror exactly what the header/footer rendered before this
 * feature, so the public site is visually unchanged until an admin edits it.
 * Seeded only for menus that are currently empty (admin deletions stick).
 */
const SEEDS: Record<MenuKey, SeedItem[]> = {
  navbar: [
    { label: 'Home', url: '/' },
    { label: 'All Courses', url: '/courses' },
  ],
  navbar_more: [
    { label: 'About Us', url: '/about' },
    { label: 'Blog', url: '/blog' },
    { label: 'Verify Certificate', url: '/verify' },
    { label: 'Contact', url: '/contact' },
  ],
  footer_company: [
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Join as Instructor', url: '/contact' },
    { label: 'Privacy Policy', url: '/privacy-policy' },
    { label: 'Return Policy', url: '/return-policy' },
    { label: 'Terms & Conditions', url: '/terms-conditions' },
  ],
  footer_others: [
    { label: 'Upcoming Live Batch', url: '/live-classes' },
    { label: 'Blog', url: '/blog' },
    { label: 'Free Courses', url: '/free-courses' },
    { label: 'Success Stories', url: '/success-stories' },
    { label: 'Mentors', url: '/our-instructor' },
    { label: 'Verify Certificate', url: '/verify' },
    { label: 'Your Questions', url: '/faq' },
  ],
};

@Injectable()
export class MenusService implements OnModuleInit {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  async onModuleInit() {
    for (const menu of MENU_KEYS) {
      const existing = await this.db
        .select({ id: menuItems.id })
        .from(menuItems)
        .where(eq(menuItems.menu, menu))
        .limit(1);

      // Only seed a menu that has never been populated. Once an admin has
      // touched it (even deleting everything), we leave it alone.
      if (existing.length === 0) {
        await this.db.insert(menuItems).values(
          SEEDS[menu].map((item, i) => ({
            menu,
            label: item.label,
            url: item.url,
            isExternal: /^https?:\/\//i.test(item.url),
            order: i,
          })),
        );
      }
    }
  }

  /** Public — active items only, grouped by menu, ordered. */
  async getPublicGrouped() {
    const rows = await this.db
      .select()
      .from(menuItems)
      .where(eq(menuItems.isActive, true))
      .orderBy(asc(menuItems.order));
    return this.group(rows);
  }

  /** Admin — all items (incl. disabled), grouped by menu, ordered. */
  async getAdminGrouped() {
    const rows = await this.db
      .select()
      .from(menuItems)
      .orderBy(asc(menuItems.order));
    return this.group(rows);
  }

  private group(rows: (typeof menuItems.$inferSelect)[]) {
    const grouped: Record<string, typeof rows> = {
      navbar: [],
      navbar_more: [],
      footer_company: [],
      footer_others: [],
    };
    for (const row of rows) {
      (grouped[row.menu] ??= []).push(row);
    }
    return grouped;
  }

  async create(data: {
    menu: string;
    label: string;
    url: string;
    isExternal?: boolean;
    openInNewTab?: boolean;
  }) {
    // Append to the end of the target menu.
    const siblings = await this.db
      .select({ order: menuItems.order })
      .from(menuItems)
      .where(eq(menuItems.menu, data.menu));
    const nextOrder = siblings.reduce((max, s) => Math.max(max, s.order + 1), 0);

    const [row] = await this.db
      .insert(menuItems)
      .values({
        menu: data.menu,
        label: data.label,
        url: data.url,
        isExternal: data.isExternal ?? false,
        openInNewTab: data.openInNewTab ?? false,
        order: nextOrder,
      })
      .returning();
    this.revalidation.revalidate([CacheTag.menus]);
    return row;
  }

  async update(
    id: number,
    data: {
      label?: string;
      url?: string;
      isExternal?: boolean;
      openInNewTab?: boolean;
    },
  ) {
    const [row] = await this.db
      .update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.menus]);
    return row;
  }

  async toggle(id: number) {
    const [existing] = await this.db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);
    if (!existing) return null;

    const [row] = await this.db
      .update(menuItems)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    this.revalidation.revalidate([CacheTag.menus]);
    return row;
  }

  async reorder(items: { id: number; order: number }[]) {
    for (const { id, order } of items) {
      await this.db
        .update(menuItems)
        .set({ order, updatedAt: new Date() })
        .where(eq(menuItems.id, id));
    }
    this.revalidation.revalidate([CacheTag.menus]);
  }

  async delete(id: number) {
    await this.db.delete(menuItems).where(eq(menuItems.id, id));
    this.revalidation.revalidate([CacheTag.menus]);
  }
}
