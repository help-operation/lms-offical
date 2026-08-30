import { apiRequest } from "@/lib/api-client";

export interface CourseProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface IssuedCertificate {
  id: number;
  userId: number;
  courseId: number;
  certificateCode: string;
  certificateUrl: string | null;
  issuedAt: string | null;
}

export interface MarkCompleteResult {
  id: number;
  /** True once every lesson in the course is complete. */
  courseCompleted: boolean;
  /** The certificate auto-issued on the final lesson, if any. */
  certificate: IssuedCertificate | null;
}

export const progressApi = {
  markComplete: (lessonId: number) =>
    apiRequest<MarkCompleteResult>(`/student/lessons/${lessonId}/complete`, {
      method: "POST",
    }),

  updateWatched: (lessonId: number, watchedSeconds: number) =>
    apiRequest<null>(`/student/lessons/${lessonId}/progress`, {
      method: "POST",
      body: JSON.stringify({ watchedSeconds }),
    }),

  getCourseProgress: (courseId: number) =>
    apiRequest<CourseProgress>(`/student/courses/${courseId}/progress`),
};
