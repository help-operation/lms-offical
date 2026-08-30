import { apiRequest } from "@/lib/api-client";
import type { InstructorApplication } from "../types";

export const instructorApplicationsApi = {
  getAll: () => apiRequest<InstructorApplication[]>("/instructor-applications/admin"),
  approve: (id: number) =>
    apiRequest<InstructorApplication>(`/instructor-applications/admin/${id}/approve`, { method: "PATCH" }),
  reject: (id: number, notes?: string) =>
    apiRequest<InstructorApplication>(`/instructor-applications/admin/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),
  delete: (id: number) =>
    apiRequest<{ success: boolean }>(`/instructor-applications/admin/${id}`, { method: "DELETE" }),
};
