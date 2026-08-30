import { apiRequest } from "@/lib/api-client";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnail: string | null;
  status: string;
  categoryId: number | null;
  publishedAt: string | null;
  createdAt: string | null;
  authorId: number;
  authorFirstName: string;
  authorLastName: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export const blogAdminApi = {
  list: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<BlogPost>>(`/blog/admin/posts${q.toString() ? `?${q}` : ""}`);
  },

  getById: (id: number) =>
    apiRequest<BlogPost>(`/blog/admin/posts/${id}`),

  categories: () =>
    apiRequest<BlogCategory[]>("/blog/categories"),

  create: (data: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean }) =>
    apiRequest<BlogPost>("/blog", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean }) =>
    apiRequest<BlogPost>(`/blog/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: number) =>
    apiRequest<{ success: boolean }>(`/blog/${id}`, { method: "DELETE" }),
};
