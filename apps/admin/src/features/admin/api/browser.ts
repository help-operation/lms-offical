import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { AdminUser, AdminCourse, AdminCategory, Coupon, PaginatedResponse, TableQueryParams } from "./index";

function buildQuery(params: TableQueryParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  return q.toString() ? `?${q}` : "";
}

export const adminApiBrowser = {
  users: (params?: TableQueryParams) =>
    apiRequestBrowser<PaginatedResponse<AdminUser>>(`/admin/users${buildQuery(params ?? {})}`),

  coupons: (params?: TableQueryParams) =>
    apiRequestBrowser<PaginatedResponse<Coupon>>(`/admin/coupons${buildQuery(params ?? {})}`),

  categories: (params?: TableQueryParams) =>
    apiRequestBrowser<PaginatedResponse<AdminCategory>>(`/admin/categories${buildQuery(params ?? {})}`),

  suspendUser: (id: number) =>
    apiRequestBrowser<{ id: number; status: string }>(`/admin/users/${id}/suspend`, { method: "POST" }),
  activateUser: (id: number) =>
    apiRequestBrowser<{ id: number; status: string }>(`/admin/users/${id}/activate`, { method: "POST" }),
  changeRole: (id: number, role: string) =>
    apiRequestBrowser<{ id: number; role: string }>(`/admin/users/${id}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  approveCourse: (id: number) =>
    apiRequestBrowser<AdminCourse>(`/admin/courses/${id}/approve`, { method: "POST" }),
  rejectCourse: (id: number) =>
    apiRequestBrowser<AdminCourse>(`/admin/courses/${id}/reject`, { method: "POST" }),
  featureCourse: (id: number) =>
    apiRequestBrowser<AdminCourse>(`/admin/courses/${id}/feature`, { method: "POST" }),

  createCategory: (data: { name: string; description?: string; icon?: string }) =>
    apiRequestBrowser<AdminCategory>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    apiRequestBrowser<null>(`/admin/categories/${id}`, { method: "DELETE" }),
  toggleCategory: (id: number) =>
    apiRequestBrowser<AdminCategory>(`/admin/categories/${id}/toggle`, { method: "POST" }),

  createCoupon: (data: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string }) =>
    apiRequestBrowser<Coupon>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: number) =>
    apiRequestBrowser<null>(`/admin/coupons/${id}`, { method: "DELETE" }),
  toggleCoupon: (id: number) =>
    apiRequestBrowser<Coupon>(`/admin/coupons/${id}/toggle`, { method: "POST" }),
};
