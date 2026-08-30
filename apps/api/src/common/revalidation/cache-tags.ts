/**
 * Cache tags shared with the public web app (`apps/web`).
 *
 * These strings MUST match the `cacheTag(...)` values used in the web app's
 * `"use cache"` units (and the `next: { tags }` fetch options) — they are the
 * contract for cross-app invalidation via `POST {WEB_URL}/api/revalidate`.
 * Treat the web `cacheTag` calls as the source of truth; keep this in sync.
 */
export const CacheTag = {
  courses: 'courses',
  cms: 'cms',
  banners: 'banners',
  menus: 'menus',
  instructors: 'instructors',
  successStories: 'success-stories',
  featuredReviews: 'featured-reviews',
  generalSettings: 'general-settings',
  socialSettings: 'social-settings',
  trackingSettings: 'tracking-settings',
  codeSnippets: 'code-snippets',
  maintenance: 'maintenance',
  blog: 'blog',
} as const;

/**
 * Every broad cache tag, for a global "Purge All" (LiteSpeed-style).
 *
 * The per-entity tags (`page:<slug>`, `blog:<slug>`, `page-sections:<page>`) are
 * intentionally NOT listed: their cached units are also tagged with a broad parent
 * (`cms`, `blog`, `page-sections` respectively), so purging the parent drops them
 * all. Keep this in sync with `CacheTag` and the web `cacheTag(...)` calls.
 */
export const ALL_CACHE_TAGS: string[] = [
  CacheTag.courses,
  CacheTag.cms,
  CacheTag.banners,
  CacheTag.menus,
  CacheTag.instructors,
  CacheTag.successStories,
  CacheTag.featuredReviews,
  CacheTag.generalSettings,
  CacheTag.socialSettings,
  CacheTag.trackingSettings,
  CacheTag.codeSnippets,
  CacheTag.maintenance,
  CacheTag.blog,
  'page-sections',
];

/** Tags to purge when a CMS page (`sitePages`) changes. */
export function pageTags(slug: string): string[] {
  return [CacheTag.cms, `page:${slug}`];
}

/** Tag to purge when the page-section blocks of a given page change. */
export function pageSectionsTag(page: string): string {
  return `page-sections:${page}`;
}

/** Tags to purge when a blog post changes. */
export function blogTags(slug?: string | null): string[] {
  return slug ? [CacheTag.blog, `blog:${slug}`] : [CacheTag.blog];
}

/**
 * Map `systemSettings` keys to the web cache tags they affect.
 *
 * All settings funnel through `SystemSettingsService.set`/`setMany`, so the tag is
 * derived from the key prefix:
 *   - `social_*`      → `social-settings`
 *   - `maintenance_*` → `maintenance`
 *   - `general_`/`footer_`/`contact_`/`about_`/`faq_*` → `general-settings`
 * Keys with no public read surface (e.g. `payment_*`) map to nothing.
 */
export function settingsKeysToTags(keys: string[]): string[] {
  const tags = new Set<string>();
  for (const key of keys) {
    if (key.startsWith('social_')) {
      tags.add(CacheTag.socialSettings);
    } else if (key.startsWith('maintenance_')) {
      tags.add(CacheTag.maintenance);
    } else if (
      key.startsWith('general_') ||
      key.startsWith('footer_') ||
      key.startsWith('contact_') ||
      key.startsWith('about_') ||
      key.startsWith('faq_') ||
      key === 'payment_checkout_image'
    ) {
      tags.add(CacheTag.generalSettings);
    }
  }
  return [...tags];
}
