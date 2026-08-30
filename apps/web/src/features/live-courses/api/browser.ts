import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { LivePlaybackInfo, SubscriptionStatus, SubscriptionPayment } from "./curriculum";
import type {
  QuizTake,
  QuizResult,
  AssignmentView,
  AssignmentSubmission,
} from "@/features/learn/api/lessons/browser";
import type { Note } from "@/features/learn/api/notes/index";

export interface LiveMarkCompleteResult {
  courseCompleted: boolean;
  certificate: { certificateCode: string } | null;
}

// Browser-safe client for live-course endpoints used inside Client Components.
// The server variant in `curriculum.ts` depends on `next/headers` (cookies) and
// must not be imported into the client bundle.
export const liveCurriculumApiBrowser = {
  playback: (lessonId: number) =>
    apiRequestBrowser<LivePlaybackInfo>(`/live-lessons/${lessonId}/playback`),

  markComplete: (lessonId: number) =>
    apiRequestBrowser<LiveMarkCompleteResult>(`/live-lessons/${lessonId}/complete`, {
      method: "POST",
    }),

  notes: {
    list: (lessonId: number) =>
      apiRequestBrowser<Note[]>(`/live-lessons/${lessonId}/notes`),

    create: (lessonId: number, content: string, videoTimestamp = 0) =>
      apiRequestBrowser<Note>(`/live-lessons/${lessonId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content, videoTimestamp }),
      }),

    update: (lessonId: number, noteId: number, content: string) =>
      apiRequestBrowser<Note>(`/live-lessons/${lessonId}/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }),

    remove: (lessonId: number, noteId: number) =>
      apiRequestBrowser<null>(`/live-lessons/${lessonId}/notes/${noteId}`, {
        method: "DELETE",
      }),
  },
};

// ── Subscription API (browser-safe) ───────────────────────────────────────
export const liveSubscriptionApiBrowser = {
  /** Subscription status for a live course enrollment */
  status: (courseId: number) =>
    apiRequestBrowser<{ enrolled: boolean; subscription: SubscriptionStatus | null }>(
      `/live-subscriptions/${courseId}/subscription-status`,
    ),

  /** Payment history for a subscription */
  payments: (subscriptionId: number) =>
    apiRequestBrowser<SubscriptionPayment[]>(
      `/live-subscriptions/${subscriptionId}/subscription-payments`,
    ),

  /** Cancel a subscription */
  cancel: (courseId: number, subscriptionId: number) =>
    apiRequestBrowser<{ success: boolean }>(`/live-subscriptions/${courseId}/cancel-subscription`, {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    }),

  /** Renew subscription — initiates payment and returns paymentUrl */
  renew: (courseId: number, subscriptionId: number) =>
    apiRequestBrowser<{ paymentUrl: string; gateway: string }>(
      `/live-subscriptions/${courseId}/renew-subscription`,
      {
        method: "POST",
        body: JSON.stringify({ subscriptionId }),
      },
    ),
};

/**
 * Student quiz/assignment take/submit for live-course lessons. Same shapes as
 * the recorded `lessonsApiBrowser`, different endpoints — so the shared
 * QuizRunner/AssignmentView components can drive both via a `variant` prop.
 */
export const liveLessonAssessmentsApiBrowser = {
  getQuiz: (lessonId: number) =>
    apiRequestBrowser<QuizTake | null>(`/live-lessons/${lessonId}/quiz/take`),
  submitQuiz: (quizId: number, answers: { questionId: number; answerIds: number[] }[]) =>
    apiRequestBrowser<QuizResult>(`/live-quizzes/${quizId}/attempt`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getAssignment: (lessonId: number) =>
    apiRequestBrowser<AssignmentView | null>(`/live-lessons/${lessonId}/assignment/view`),
  submitAssignment: (assignmentId: number, data: { content?: string; fileUrls?: string[] }) =>
    apiRequestBrowser<AssignmentSubmission>(`/live-assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
