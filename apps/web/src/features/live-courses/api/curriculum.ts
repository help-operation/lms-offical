import { apiRequest } from "@/lib/api-client";

export interface LiveLessonProgress {
  id: number;
  completedAt: string | null;
}

export interface LiveLesson {
  id: number;
  moduleId: number;
  liveCourseId: number;
  title: string;
  type: "video" | "text" | "quiz" | "assignment";
  videoSource: "bunny" | "external" | null;
  bunnyVideoId: string | null;
  bunnyStatus: "processing" | "ready" | "failed" | null;
  externalVideoUrl: string | null;
  duration: number;
  content: string | null;
  isFree: boolean;
  order: number;
  progress: LiveLessonProgress | null;
  isLocked: boolean;
}

export interface LiveModule {
  id: number;
  liveCourseId: number;
  title: string;
  order: number;
  lessons: LiveLesson[];
}

export type LivePlaybackInfo =
  | { source: "bunny"; iframeUrl: string; status: "processing" | "ready" | "failed" | null }
  | { source: "external"; url: string };

export interface SubscriptionStatus {
  id: number;
  status: "pending" | "active" | "past_due" | "cancelled" | "expired" | "paused";
  monthlyPrice: string;
  nextBillingDate: string | null;
  gateway: string;
  lastPaymentAt: string | null;
  cancelledAt: string | null;
  canCancel: boolean;
  canRenew: boolean;
}

export interface SubscriptionPayment {
  id: number;
  subscriptionId: number;
  amount: string;
  method: string;
  gatewayInvoiceId: string | null;
  gatewayTransactionId: string | null;
  status: string;
  gatewayResponse: unknown | null;
  paidAt: string | null;
  createdAt: string;
}

export const liveCurriculumApi = {
  enrollmentStatus: (courseId: number) =>
    apiRequest<{
      enrolled: boolean;
      reason: "suspended" | "expired" | null;
      statusReason?: string | null;
      expiresAt?: string | null;
      courseCompleted?: boolean;
    }>(`/live-courses/${courseId}/enrollment-status`),

  /** Live-course ids the logged-in user is enrolled in (for marking cards). */
  myEnrollments: () =>
    apiRequest<{ courseIds: number[] }>(`/live-courses/enrolled/mine`),

  curriculum: (courseId: number) =>
    apiRequest<LiveModule[]>(`/live-courses/${courseId}/curriculum`),

  playback: (lessonId: number) =>
    apiRequest<LivePlaybackInfo>(`/live-lessons/${lessonId}/playback`),

  /** Subscription status for a live course enrollment */
  subscriptionStatus: (courseId: number) =>
    apiRequest<{ enrolled: boolean; subscription: SubscriptionStatus | null }>(
      `/live-subscriptions/${courseId}/subscription-status`,
    ),

  /** Payment history for a subscription */
  subscriptionPayments: (subscriptionId: number) =>
    apiRequest<SubscriptionPayment[]>(
      `/live-subscriptions/${subscriptionId}/subscription-payments`,
    ),

  /** Cancel a subscription */
  cancelSubscription: (courseId: number, subscriptionId: number) =>
    apiRequest<{ success: boolean }>(`/live-subscriptions/${courseId}/cancel-subscription`, {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    }),
};
