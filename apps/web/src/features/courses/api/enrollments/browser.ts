import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { Enrollment, CurriculumModule } from "./index";

export const enrollmentsApiBrowser = {
  enroll: (courseId: number) =>
    apiRequestBrowser<{ id: number }>(`/courses/${courseId}/enroll`, { method: "POST" }),
  myEnrollments: () => apiRequestBrowser<Enrollment[]>("/student/enrollments"),
  enrollmentStatus: (courseId: number) =>
    apiRequestBrowser<{ enrolled: boolean }>(`/courses/${courseId}/enrollment-status`),
  curriculum: (courseId: number) =>
    apiRequestBrowser<CurriculumModule[]>(`/learn/${courseId}/curriculum`),
};
