import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import type { BlogPost, BlogCategory } from "./index";

function buildQuery(params: TableQueryParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  return q.toString() ? `?${q}` : "";
}

export const blogAdminApiBrowser = {
  list: (params?: TableQueryParams) =>
    apiRequestBrowser<PaginatedResponse<BlogPost>>(`/blog/admin/posts${buildQuery(params ?? {})}`),

  categories: () =>
    apiRequestBrowser<BlogCategory[]>("/blog/categories"),

  create: (data: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean }) =>
    apiRequestBrowser<BlogPost>("/blog", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean }) =>
    apiRequestBrowser<BlogPost>(`/blog/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: number) =>
    apiRequestBrowser<{ success: boolean }>(`/blog/${id}`, { method: "DELETE" }),
};
