import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { CourseProgress, MarkCompleteResult } from "./index";

export const progressApiBrowser = {
  markComplete: (lessonId: number) =>
    apiRequestBrowser<MarkCompleteResult>(
      `/student/lessons/${lessonId}/complete`,
      { method: "POST" },
    ),
  updateWatched: (lessonId: number, watchedSeconds: number) =>
    apiRequestBrowser<null>(`/student/lessons/${lessonId}/progress`, {
      method: "POST",
      body: JSON.stringify({ watchedSeconds }),
    }),
  getCourseProgress: (courseId: number) =>
    apiRequestBrowser<CourseProgress>(`/student/courses/${courseId}/progress`),
};
