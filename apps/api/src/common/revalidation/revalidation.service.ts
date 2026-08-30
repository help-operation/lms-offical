import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ALL_CACHE_TAGS } from './cache-tags';

export type PurgeResult =
  | { ok: true; tags: string[] }
  | { ok: false; reason: 'disabled' | 'failed'; tags: string[] };

/**
 * Cross-app cache invalidation. After a write that changes public content, the API
 * tells the web app to purge the matching `"use cache"` tags so the public site
 * refreshes immediately instead of waiting for each tag's TTL.
 *
 * Two flavours:
 *  - `revalidate()` / `revalidateAll()` — fire-and-forget, used after content writes
 *    so they never add latency to the triggering request. Never throw.
 *  - `purgeAll()` — awaitable, used by the manual "Purge All" admin button so the UI
 *    can report whether the purge actually reached the web app.
 *
 * All variants no-op when `WEB_URL` or `REVALIDATE_SECRET` are unset (e.g. local dev
 * without the web app running), so the API works unchanged in those environments.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  private readonly webUrl?: string;
  private readonly secret?: string;

  constructor(config: ConfigService) {
    this.webUrl = config.get<string>('WEB_URL');
    this.secret = config.get<string>('REVALIDATE_SECRET');
  }

  private get enabled(): boolean {
    return Boolean(this.webUrl && this.secret);
  }

  /** POST the tags to the web app's revalidate endpoint. Resolves to the Response. */
  private send(tags: string[]): Promise<Response> {
    return fetch(`${this.webUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': this.secret as string,
      },
      body: JSON.stringify({ tags }),
    });
  }

  /**
   * Purge the given web cache tags. Non-blocking: the request is sent without being
   * awaited so it never adds latency to the admin mutation that triggered it.
   */
  revalidate(tags: string[]): void {
    if (!this.enabled || tags.length === 0) return;

    void this.send(tags).catch((err) => {
      // Non-fatal: the write already succeeded; the cache will refresh on its TTL.
      this.logger.warn(
        `Cache revalidation failed for [${tags.join(', ')}]: ${String(err)}`,
      );
    });
  }

  /** Fire-and-forget purge of every public cache tag. */
  revalidateAll(): void {
    this.revalidate(ALL_CACHE_TAGS);
  }

  /**
   * Awaitable "Purge All" for the manual admin button. Reports whether the request
   * actually reached the web app, so the UI can show an honest result.
   */
  async purgeAll(): Promise<PurgeResult> {
    if (!this.enabled) {
      return { ok: false, reason: 'disabled', tags: ALL_CACHE_TAGS };
    }

    try {
      const res = await this.send(ALL_CACHE_TAGS);
      if (!res.ok) {
        this.logger.warn(`Purge all returned HTTP ${res.status}`);
        return { ok: false, reason: 'failed', tags: ALL_CACHE_TAGS };
      }
      return { ok: true, tags: ALL_CACHE_TAGS };
    } catch (err) {
      this.logger.warn(`Purge all failed: ${String(err)}`);
      return { ok: false, reason: 'failed', tags: ALL_CACHE_TAGS };
    }
  }
}
