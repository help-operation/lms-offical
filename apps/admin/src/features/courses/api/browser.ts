// Browser-safe course API calls for Client Components
import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { CourseModule, InstructorCourse } from "./index";

export const coursesBrowserApi = {
  get: (courseId: number) =>
    apiRequestBrowser<InstructorCourse>(`/course-builder/${courseId}`),

  getCurriculum: (courseId: number) =>
    apiRequestBrowser<CourseModule[]>(`/course-builder/${courseId}/curriculum`),
};
