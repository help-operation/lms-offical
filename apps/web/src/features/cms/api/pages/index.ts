import { apiRequest, publicApiRequest } from "@/lib/api-client";

export interface SitePage {
  id: number;
  slug: string;
  title: string;
  content: string;
  updatedAt: string | null;
}

export const pagesApi = {
  get: (slug: string) => apiRequest<SitePage>(`/pages/${slug}`),
};

/**
 * Cached public fetch for a CMS page (privacy policy, terms, etc.).
 * Content changes rarely → cache for days; tagged so a CMS edit can invalidate
 * it via `updateTag('cms')` or `updateTag('page:<slug>')`.
 */
export async function getCachedPage(slug: string): Promise<SitePage | null> {
  try {
    const res = await publicApiRequest<SitePage>(`/pages/${slug}`, {
      next: { revalidate: 86400, tags: ["cms", `page:${slug}`] },
    });
    return res.data;
  } catch {
    return null;
  }
}
