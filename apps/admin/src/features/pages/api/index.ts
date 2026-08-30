import { apiRequest } from "@/lib/api-client";

export interface SitePage {
  id: number;
  slug: string;
  title: string;
  content: string;
  updatedAt: string | null;
}

export const pagesAdminApi = {
  get: (slug: string) =>
    apiRequest<SitePage>(`/pages/${slug}`),

  update: (slug: string, content: string) =>
    apiRequest<SitePage>(`/pages/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
};
