"use client";

import {
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
} from "@/features/courses/actions/courses.actions";
import {
  getBunnyCredentialsAction,
  setExternalUrlAction,
} from "@/features/courses/actions/upload.actions";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { CourseModule, Lesson, LessonType } from "@/features/courses/api";
import type { BunnyCredentialsResult } from "./useLessonVideoUploads";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

/** Which optional curriculum features a course type supports. */
export interface CurriculumFeatures {
  /** Lesson types offered in the add/edit pickers. */
  lessonTypes: LessonType[];
  /** Free-preview (eye) toggle on lessons. */
  freePreview: boolean;
  /** Quiz lessons + quiz builder. */
  quiz: boolean;
  /** Assignment lessons + assignment builder. */
  assignment: boolean;
  /** In-row ▶ video preview. */
  preview: boolean;
  /** Resources/downloads section in the lesson edit modal. */
  resources: boolean;
}

/**
 * Everything the shared CurriculumBuilder needs that differs between course
 * types (recorded vs live). One adapter per course type wires its own server
 * actions and endpoints; the builder UI stays identical.
 */
export interface CurriculumAdapter {
  createModule(courseId: number, title: string): Promise<ActionResult<CourseModule>>;
  renameModule(courseId: number, moduleId: number, title: string): Promise<ActionResult>;
  deleteModule(courseId: number, moduleId: number): Promise<ActionResult>;
  reorderModules(courseId: number, ordered: { id: number; order: number }[]): Promise<ActionResult>;
  createLesson(
    courseId: number,
    moduleId: number,
    data: { title: string; type: LessonType; isFree: boolean },
  ): Promise<ActionResult<Lesson>>;
  updateLesson(
    courseId: number,
    moduleId: number,
    lessonId: number,
    data: Record<string, unknown>,
  ): Promise<ActionResult<Lesson>>;
  deleteLesson(courseId: number, moduleId: number, lessonId: number): Promise<ActionResult>;
  reorderLessons(courseId: number, moduleId: number, ordered: { id: number; order: number }[]): Promise<ActionResult>;
  getBunnyCredentials(lessonId: number): Promise<BunnyCredentialsResult>;
  setExternalUrl(courseId: number, lessonId: number, url: string, duration?: number): Promise<{ success: boolean; message?: string }>;
  /** Returns the current Bunny status for polling (self-heals server-side). */
  fetchLessonStatus(lessonId: number): Promise<{ status: string | null; duration?: number }>;
  /** API path the preview modal hits to resolve playback. */
  playbackPath(lessonId: number): string;
  /** Base path for the quiz/assignment endpoints (drives the builder modals). */
  assessmentBasePath: string;
  features: CurriculumFeatures;
}

export const recordedCurriculumAdapter: CurriculumAdapter = {
  createModule: (courseId, title) => createModuleAction(courseId, title),
  renameModule: (courseId, moduleId, title) => updateModuleAction(courseId, moduleId, { title }),
  deleteModule: (courseId, moduleId) => deleteModuleAction(courseId, moduleId),
  reorderModules: (courseId, ordered) => reorderModulesAction(courseId, ordered),
  createLesson: (courseId, moduleId, data) => createLessonAction(courseId, moduleId, data),
  updateLesson: (courseId, moduleId, lessonId, data) =>
    updateLessonAction(courseId, moduleId, lessonId, data),
  deleteLesson: (courseId, moduleId, lessonId) => deleteLessonAction(courseId, moduleId, lessonId),
  reorderLessons: (courseId, moduleId, ordered) => reorderLessonsAction(courseId, moduleId, ordered),
  getBunnyCredentials: (lessonId) => getBunnyCredentialsAction(lessonId),
  setExternalUrl: (_courseId, lessonId, url, duration) => setExternalUrlAction(lessonId, url, duration),
  fetchLessonStatus: async (lessonId) => {
    const res = await apiRequestBrowser<{ source: string; status?: string; duration?: number }>(
      `/course-builder/lessons/${lessonId}/playback`,
    );
    return { status: res.data.status ?? null, duration: res.data.duration };
  },
  playbackPath: (lessonId) => `/course-builder/lessons/${lessonId}/playback`,
  assessmentBasePath: "/course-builder",
  features: {
    lessonTypes: ["video", "text", "quiz", "assignment"],
    freePreview: true,
    quiz: true,
    assignment: true,
    preview: true,
    resources: true,
  },
};
