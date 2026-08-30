import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { InstructorApplication } from "../types";

export const instructorApplicationsApiBrowser = {
  approve: (id: number) =>
    apiRequestBrowser<InstructorApplication>(`/instructor-applications/admin/${id}/approve`, { method: "PATCH" }),

  reject: (id: number, notes?: string) =>
    apiRequestBrowser<InstructorApplication>(`/instructor-applications/admin/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),

  delete: (id: number) =>
    apiRequestBrowser(`/instructor-applications/admin/${id}`, { method: "DELETE" }),
};
