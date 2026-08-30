import { publicApiRequest } from "@/lib/api-client";

export type PageSection = {
  id: number;
  page: string;
  slug: string;
  label: string;
  type: string;
  order: number;
  active: boolean;
  content: Record<string, unknown>;
  updatedAt: string;
};

/**
 * Server-side fetch for the public CMS sections of a page.
 *
 * Cached for a few minutes — admin edits propagate within ~1 minute without
 * any cross-app webhook. Tagged so a future `revalidateTag` call (e.g. from a
 * NestJS webhook, if we ever add one) can purge on demand.
 *
 * Uses `publicApiRequest` (cookie-free) because `'use cache'` units must not
 * read request-scoped values like cookies — the cached output is shared
 * across all users.
 */
export async function getPublicPageSections(page: string): Promise<PageSection[]> {
  // Per-page tag for targeted edits + a broad `page-sections` tag so a global
  // "Purge All" can drop every page's sections at once.
  const res = await publicApiRequest<PageSection[]>(
    `/page-sections/public/${page}`,
    { next: { revalidate: 3600, tags: [`page-sections:${page}`, "page-sections"] } },
  ).catch(() => null);
  return res?.data ?? [];
}
