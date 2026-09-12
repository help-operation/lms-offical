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
  publishAt: string | null;
  isFeatured: boolean;
  createdAt: string | null;
  authorId: number;
  authorFirstName: string;
  authorLastName: string;
  readingTime?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  tags?: BlogTag[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogAuthor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  role: string;
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

  tags: () =>
    apiRequest<BlogTag[]>("/blog/tags"),

  createTag: (name: string) =>
    apiRequest<BlogTag>("/blog/tags", { method: "POST", body: JSON.stringify({ name }) }),

  deleteTag: (id: number) =>
    apiRequest<{ success: boolean }>(`/blog/tags/${id}`, { method: "DELETE" }),

  authors: () =>
    apiRequest<BlogAuthor[]>("/blog/admin/authors"),

  create: (data: { title: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number; publish?: boolean; scheduleAt?: string; tags?: number[]; metaTitle?: string; metaDescription?: string; ogImage?: string; isFeatured?: boolean; authorId?: number }) =>
    apiRequest<BlogPost>("/blog", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: { title?: string; slug?: string; excerpt?: string; content?: string; thumbnail?: string; categoryId?: number | null; publish?: boolean; scheduleAt?: string | null; tags?: number[]; metaTitle?: string | null; metaDescription?: string | null; ogImage?: string | null; isFeatured?: boolean; authorId?: number }) =>
    apiRequest<BlogPost>(`/blog/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: number) =>
    apiRequest<{ success: boolean }>(`/blog/${id}`, { method: "DELETE" }),
};
