import { apiRequest } from "@/lib/api-client";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import type { Student, StudentDetail } from "../types";

export const studentsApi = {
  list: (params?: TableQueryParams) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
      });
    }
    return apiRequest<PaginatedResponse<Student>>(`/admin/students${q.toString() ? `?${q}` : ""}`);
  },

  get: (id: number) =>
    apiRequest<StudentDetail>(`/admin/students/${id}`),

  update: (id: number, data: { firstName?: string; lastName?: string; email?: string; phone?: string }) =>
    apiRequest<Student>(`/admin/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequest<{ id: number; status: string }>(`/admin/students/${id}/toggle`, { method: "POST" }),

  // Students are rows in the shared `users` table, so the generic user
  // password-reset endpoint works for them too.
  resetPassword: (id: number, password: string) =>
    apiRequest<{ id: number }>(`/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    }),

  delete: (id: number) =>
    apiRequest<{ success: boolean }>(`/admin/students/${id}`, { method: "DELETE" }),
};
