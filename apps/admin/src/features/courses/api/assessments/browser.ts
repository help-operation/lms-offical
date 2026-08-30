import { apiRequestBrowser } from "@/lib/api-client-browser";

export type QuizQuestionType = "single" | "multiple";

export interface QuizAnswer {
  id: number;
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  type: QuizQuestionType;
  order: number;
  answers: QuizAnswer[];
}

export interface Quiz {
  id: number;
  lessonId: number | null;
  courseId: number;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface Assignment {
  id: number;
  lessonId: number | null;
  courseId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  /** Not returned by the live-course assignment endpoint yet — default to 1/false when absent. */
  maxFiles?: number;
  filesRequired?: boolean;
}

export interface AssignmentSubmission {
  id: number;
  userId: number;
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
  firstName: string;
  lastName: string;
  email: string | null;
}

interface QuestionInput {
  question: string;
  type: QuizQuestionType;
  answers: { answer: string; isCorrect: boolean }[];
}

export interface LessonResource {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string | null;
  content: string | null;
  createdAt: string | null;
}

/**
 * The quiz/assignment endpoints have identical shapes for recorded and live
 * courses — only the base path differs (`/course-builder` vs
 * `/admin/live-courses`). The builder modals receive the right instance via
 * the curriculum adapter, so the same UI drives both course types.
 *
 * Resources are recorded-only (no live resources backend), so the live base
 * path simply never calls them.
 */
export function createAssessmentsBrowserApi(basePath: string) {
  return {
    // Quiz
    getQuiz: (lessonId: number) =>
      apiRequestBrowser<Quiz | null>(`${basePath}/lessons/${lessonId}/quiz`),
    upsertQuiz: (lessonId: number, data: { title: string; passingScore: number }) =>
      apiRequestBrowser<Quiz>(`${basePath}/lessons/${lessonId}/quiz`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteQuiz: (lessonId: number) =>
      apiRequestBrowser<{ deleted: true }>(`${basePath}/lessons/${lessonId}/quiz`, {
        method: "DELETE",
      }),
    addQuestion: (quizId: number, data: QuestionInput) =>
      apiRequestBrowser<Quiz>(`${basePath}/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateQuestion: (questionId: number, data: QuestionInput) =>
      apiRequestBrowser<Quiz>(`${basePath}/questions/${questionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteQuestion: (questionId: number) =>
      apiRequestBrowser<{ deleted: true }>(`${basePath}/questions/${questionId}`, {
        method: "DELETE",
      }),

    // Assignment
    getAssignment: (lessonId: number) =>
      apiRequestBrowser<Assignment | null>(`${basePath}/lessons/${lessonId}/assignment`),
    upsertAssignment: (
      lessonId: number,
      data: {
        title: string;
        description?: string;
        dueDate?: string;
        maxFiles?: number;
        filesRequired?: boolean;
      },
    ) =>
      apiRequestBrowser<Assignment>(`${basePath}/lessons/${lessonId}/assignment`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteAssignment: (lessonId: number) =>
      apiRequestBrowser<{ deleted: true }>(`${basePath}/lessons/${lessonId}/assignment`, {
        method: "DELETE",
      }),
    listSubmissions: (assignmentId: number) =>
      apiRequestBrowser<AssignmentSubmission[]>(
        `${basePath}/assignments/${assignmentId}/submissions`,
      ),
    gradeSubmission: (submissionId: number, data: { grade: number; feedback?: string }) =>
      apiRequestBrowser<AssignmentSubmission>(`${basePath}/submissions/${submissionId}/grade`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    // Resources (recorded only)
    listResources: (lessonId: number) =>
      apiRequestBrowser<LessonResource[]>(`${basePath}/lessons/${lessonId}/resources`),
    addResource: (
      lessonId: number,
      data: { title: string; type: string; url?: string | null; content?: string | null },
    ) =>
      apiRequestBrowser<LessonResource>(`${basePath}/lessons/${lessonId}/resources`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteResource: (resourceId: number) =>
      apiRequestBrowser<{ deleted: true }>(`${basePath}/resources/${resourceId}`, {
        method: "DELETE",
      }),
  };
}

export type AssessmentsBrowserApi = ReturnType<typeof createAssessmentsBrowserApi>;

/** Default instance for recorded courses. */
export const assessmentsBrowserApi = createAssessmentsBrowserApi("/course-builder");
