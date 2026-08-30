import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { MenuItem } from "../types";

type CreateInput = {
  menu: string;
  label: string;
  url: string;
  isExternal?: boolean;
  openInNewTab?: boolean;
};

type UpdateInput = {
  label?: string;
  url?: string;
  isExternal?: boolean;
  openInNewTab?: boolean;
};

export const menusAdminApiBrowser = {
  create: (data: CreateInput) =>
    apiRequestBrowser<MenuItem>("/menus", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateInput) =>
    apiRequestBrowser<MenuItem>(`/menus/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequestBrowser<MenuItem>(`/menus/${id}/toggle`, { method: "PATCH" }),

  reorder: (items: { id: number; order: number }[]) =>
    apiRequestBrowser(`/menus/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  delete: (id: number) =>
    apiRequestBrowser(`/menus/${id}`, { method: "DELETE" }),
};
