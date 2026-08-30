import { apiRequest } from "@/lib/api-client";

export interface Enrollment {
  id: number;
  status: string;
  enrolledAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  courseLevel: "beginner" | "intermediate" | "advanced";
  totalLessons: number;
  completedLessons: number;
  instructorFirstName: string;
  instructorLastName: string;
  // Recorded courses are learned lesson-by-lesson; live courses are batch-based
  // and open to their live-course page instead of the lesson player.
  courseType: "recorded" | "live";
  feeAmount: string | null;
  totalPaid: string;
  dueAmount: string;
  paymentStatus: "due" | "partial" | "paid" | null;
  // Subscription fields (for live courses with subscription enabled)
  paymentMode?: "one_time" | "subscription" | null;
  subscriptionStatus?: "pending" | "active" | "past_due" | "cancelled" | "expired" | "paused" | null;
  subscriptionNextBillingAt?: string | null;
  subscriptionAmount?: string | null;
}

export interface LessonProgress {
  id: number;
  userId: number;
  lessonId: number;
  courseId: number;
  watchedSeconds: number;
  completedAt: string | null;
}

export type LessonType = "video" | "text" | "quiz" | "assignment";

export interface CurriculumLesson {
  id: number;
  moduleId: number;
  title: string;
  type: LessonType;
  content: string | null;
  videoSource: "bunny" | "external" | null;
  bunnyVideoId: string | null;
  bunnyStatus: "processing" | "ready" | "failed" | null;
  externalVideoUrl: string | null;
  duration: number;
  isFree: boolean;
  order: number;
  progress: LessonProgress | null;
  isLocked: boolean;
}

export interface CurriculumModule {
  id: number;
  courseId: number;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

export const enrollmentsApi = {
  enroll: (courseId: number) =>
    apiRequest<{ id: number }>(`/courses/${courseId}/enroll`, { method: "POST" }),

  myEnrollments: () => apiRequest<Enrollment[]>("/student/enrollments"),

  enrollmentStatus: (courseId: number) =>
    apiRequest<{ enrolled: boolean; reason: 'suspended' | 'expired' | null; statusReason?: string | null; expiresAt?: string | null }>(`/courses/${courseId}/enrollment-status`),

  // Enrollment-gated curriculum (distinct path from the public one).
  curriculum: (courseId: number) =>
    apiRequest<CurriculumModule[]>(`/learn/${courseId}/curriculum`),
};
