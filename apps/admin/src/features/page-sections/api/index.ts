import { apiRequest } from "@/lib/api-client";

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

export const pageSectionsAdminApi = {
  getByPage: (page: string) =>
    apiRequest<PageSection[]>(`/page-sections/admin/${page}`),

  update: (id: number, data: { label?: string; content?: Record<string, unknown> }) =>
    apiRequest<PageSection>(`/page-sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequest<PageSection>(`/page-sections/${id}/toggle`, { method: "PATCH" }),

  reorder: (items: { id: number; order: number }[]) =>
    apiRequest(`/page-sections/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  delete: (id: number) =>
    apiRequest(`/page-sections/${id}`, { method: "DELETE" }),

  create: (data: {
    page: string;
    slug: string;
    label: string;
    type: string;
    order?: number;
    content?: Record<string, unknown>;
  }) =>
    apiRequest<PageSection>(`/page-sections`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
