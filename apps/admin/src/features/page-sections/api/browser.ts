import { apiRequestBrowser } from "@/lib/api-client-browser";

export const pageSectionsAdminApiBrowser = {
  update: (id: number, data: { label?: string; content?: Record<string, unknown> }) =>
    apiRequestBrowser(`/page-sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequestBrowser(`/page-sections/${id}/toggle`, { method: "PATCH" }),

  reorder: (items: { id: number; order: number }[]) =>
    apiRequestBrowser(`/page-sections/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  delete: (id: number) =>
    apiRequestBrowser(`/page-sections/${id}`, { method: "DELETE" }),

  create: (data: {
    page: string;
    slug: string;
    label: string;
    type: string;
    order?: number;
    content?: Record<string, unknown>;
  }) =>
    apiRequestBrowser(`/page-sections`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
