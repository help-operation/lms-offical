import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { Banner } from "../types";

export type BannerInput = {
  placement?: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  openInNewTab?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export const bannersAdminApiBrowser = {
  create: (data: BannerInput) =>
    apiRequestBrowser<Banner>("/banners", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: BannerInput) =>
    apiRequestBrowser<Banner>(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequestBrowser<Banner>(`/banners/${id}/toggle`, { method: "PATCH" }),

  reorder: (items: { id: number; order: number }[]) =>
    apiRequestBrowser(`/banners/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  delete: (id: number) =>
    apiRequestBrowser(`/banners/${id}`, { method: "DELETE" }),
};
