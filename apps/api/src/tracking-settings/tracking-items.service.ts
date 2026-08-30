import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { trackingItems } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { CacheTag } from 'src/common/revalidation/cache-tags';
import { TRACKING_ITEM_SECRET_CONFIG_FIELDS } from '@repo/validators';
import type { UpdateTrackingItemInput } from '@repo/validators';
import { TRACKING_ITEM_DEFAULTS } from './tracking-item-defaults';

@Injectable()
export class TrackingItemsService {
  constructor(
    @Inject(DB_TOKEN) private db: DB,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Seeds every known registry key on first access, matching the singleton-row pattern used by TrackingSettingsService. Skips keys that already exist so it's safe to call on every read. */
  private async ensureSeeded() {
    const existing = await this.db.select({ key: trackingItems.key }).from(trackingItems);
    const existingKeys = new Set(existing.map((r) => r.key));
    const missing = TRACKING_ITEM_DEFAULTS.filter((d) => !existingKeys.has(d.key));
    if (missing.length > 0) {
      await this.db.insert(trackingItems).values(missing).onConflictDoNothing();
    }
  }

  /** Admin — full rows including secret config fields. */
  async list() {
    await this.ensureSeeded();
    return this.db.select().from(trackingItems).orderBy(trackingItems.category, trackingItems.key);
  }

  /** Public — strips any secret sub-field out of `config` before returning. */
  async listPublic() {
    const rows = await this.list();
    return rows.map((row) => ({
      ...row,
      config: this.stripSecrets(row.config as Record<string, unknown>),
    }));
  }

  private stripSecrets(config: Record<string, unknown>) {
    const clean = { ...config };
    for (const field of TRACKING_ITEM_SECRET_CONFIG_FIELDS) delete clean[field];
    return clean;
  }

  async update(input: UpdateTrackingItemInput) {
    await this.ensureSeeded();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.enabled !== undefined) patch.enabled = input.enabled;
    if (input.config !== undefined) patch.config = input.config;

    const [updated] = await this.db
      .update(trackingItems)
      .set(patch)
      .where(eq(trackingItems.key, input.key))
      .returning();

    this.revalidation.revalidate([CacheTag.trackingSettings]);
    return updated;
  }

  async bulkUpdate(items: UpdateTrackingItemInput[]) {
    await this.ensureSeeded();
    const results: (typeof trackingItems.$inferSelect)[] = [];
    for (const item of items) {
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (item.enabled !== undefined) patch.enabled = item.enabled;
      if (item.config !== undefined) patch.config = item.config;
      const [updated] = await this.db
        .update(trackingItems)
        .set(patch)
        .where(eq(trackingItems.key, item.key))
        .returning();
      results.push(updated);
    }
    this.revalidation.revalidate([CacheTag.trackingSettings]);
    return results;
  }
}
