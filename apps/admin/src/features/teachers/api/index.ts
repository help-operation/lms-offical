import { apiRequest } from "@/lib/api-client";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import type { Teacher, TeacherDetail } from "../types";

export const teachersApi = {
  get: (id: number) =>
    apiRequest<TeacherDetail>(`/admin/teachers/${id}`),

  list: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<Teacher>>(`/admin/teachers${q.toString() ? `?${q}` : ""}`);
  },

  update: (id: number, data: { firstName?: string; lastName?: string; email?: string }) =>
    apiRequest<Teacher>(`/admin/teachers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequest<{ id: number; status: string }>(`/admin/teachers/${id}/toggle`, { method: "POST" }),

  // Teachers are rows in the `admin_users` table (not `users`), so password
  // reset goes through the admin-users endpoint instead of the generic one.
  resetPassword: (id: number, password: string) =>
    apiRequest<{ id: number }>(`/admin/admin-users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    }),

  delete: (id: number) =>
    apiRequest<{ success: boolean }>(`/admin/teachers/${id}`, { method: "DELETE" }),
};
