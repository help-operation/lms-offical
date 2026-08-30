import { apiRequestBrowser } from "@/lib/api-client-browser";

export type PlaybackInfo =
  | { source: "bunny"; iframeUrl: string; status: "processing" | "ready" | "failed" | null }
  | { source: "external"; url: string };

export interface QuizTakeAnswer {
  id: number;
  questionId: number;
  answer: string;
}
export interface QuizTakeQuestion {
  id: number;
  question: string;
  type: "single" | "multiple";
  order: number;
  answers: QuizTakeAnswer[];
}
export interface QuizAttempt {
  id: number;
  score: string;
  passed: boolean;
  completedAt: string | null;
}
export interface QuizTake {
  id: number;
  title: string;
  passingScore: number;
  questions: QuizTakeQuestion[];
  lastAttempt: QuizAttempt | null;
}
export interface QuizResult {
  attemptId: number;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passingScore: number;
}

export interface AssignmentSubmission {
  id: number;
  content: string | null;
  /** Recorded courses. Live-course submissions still send legacy `fileUrl` below. */
  fileUrls?: string[];
  /** @deprecated Live-course submissions only — recorded courses use `fileUrls`. */
  fileUrl?: string | null;
  status: "submitted" | "graded";
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
}
export interface AssignmentView {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  /** Not sent by the live-course assignment endpoint yet — default to 1/false when absent. */
  maxFiles?: number;
  filesRequired?: boolean;
  submission: AssignmentSubmission | null;
}

export interface LessonResource {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
}

export const lessonsApiBrowser = {
  playback: (lessonId: number) =>
    apiRequestBrowser<PlaybackInfo>(`/lessons/${lessonId}/playback`),

  getResources: (lessonId: number) =>
    apiRequestBrowser<LessonResource[]>(
      `/lessons/${lessonId}/resources/view`,
    ),

  getQuiz: (lessonId: number) =>
    apiRequestBrowser<QuizTake | null>(`/lessons/${lessonId}/quiz/take`),
  submitQuiz: (
    quizId: number,
    answers: { questionId: number; answerIds: number[] }[],
  ) =>
    apiRequestBrowser<QuizResult>(`/quizzes/${quizId}/attempt`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  getAssignment: (lessonId: number) =>
    apiRequestBrowser<AssignmentView | null>(
      `/lessons/${lessonId}/assignment/view`,
    ),
  submitAssignment: (
    assignmentId: number,
    data: { content?: string; fileUrls?: string[] },
  ) =>
    apiRequestBrowser<AssignmentSubmission>(
      `/assignments/${assignmentId}/submit`,
      { method: "POST", body: JSON.stringify(data) },
    ),
};
