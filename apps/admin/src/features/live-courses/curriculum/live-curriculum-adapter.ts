"use client";

import {
  createLiveCourseModuleAction,
  updateLiveCourseModuleAction,
  deleteLiveCourseModuleAction,
  reorderLiveCourseModulesAction,
  createLiveCourseLessonAction,
  updateLiveCourseLessonAction,
  deleteLiveCourseLessonAction,
  reorderLiveCourseLessonsAction,
  getLiveLessonBunnyCredentialsAction,
  setLiveLessonExternalUrlAction,
} from "@/features/live-courses/actions/live-course-curriculum.actions";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import type {
  CurriculumAdapter,
  ActionResult,
} from "@/features/courses/curriculum/curriculum-adapter";
import type { CourseModule, Lesson } from "@/features/courses/api";
import type { BunnyCredentialsResult } from "@/features/courses/curriculum/useLessonVideoUploads";

/**
 * Live-course curriculum adapter. Maps the shared builder's uniform calls onto
 * the live-course server actions/endpoints. Live lessons support video/text
 * only today; quiz/assignment land in a later phase, so those flags are off.
 */
export const liveCurriculumAdapter: CurriculumAdapter = {
  // Live module/lesson rows are structurally close but not identical to the
  // recorded types the builder is typed against; the builder only reads the
  // shared fields (id/title/lessons), so we cast through unknown.
  createModule: (courseId, title) =>
    createLiveCourseModuleAction(courseId, title) as unknown as Promise<ActionResult<CourseModule>>,
  renameModule: (courseId, moduleId, title) =>
    updateLiveCourseModuleAction(courseId, moduleId, title),
  deleteModule: (courseId, moduleId) => deleteLiveCourseModuleAction(courseId, moduleId),
  reorderModules: (courseId, ordered) => reorderLiveCourseModulesAction(courseId, ordered),
  createLesson: (courseId, moduleId, data) =>
    createLiveCourseLessonAction(courseId, moduleId, data) as unknown as Promise<ActionResult<Lesson>>,
  updateLesson: (courseId, _moduleId, lessonId, data) =>
    updateLiveCourseLessonAction(courseId, lessonId, data) as unknown as Promise<ActionResult<Lesson>>,
  deleteLesson: (courseId, _moduleId, lessonId) =>
    deleteLiveCourseLessonAction(courseId, lessonId),
  reorderLessons: (_courseId, moduleId, ordered) =>
    reorderLiveCourseLessonsAction(moduleId, ordered),
  getBunnyCredentials: (lessonId) =>
    getLiveLessonBunnyCredentialsAction(lessonId) as unknown as Promise<BunnyCredentialsResult>,
  setExternalUrl: (courseId, lessonId, url, duration) =>
    setLiveLessonExternalUrlAction(courseId, lessonId, url, duration),
  fetchLessonStatus: async (lessonId) => {
    const res = await apiRequestBrowser<{ status: string | null; duration?: number }>(
      `/admin/live-courses/lessons/${lessonId}/status`,
    );
    return res.data;
  },
  playbackPath: (lessonId) => `/admin/live-courses/lessons/${lessonId}/playback`,
  assessmentBasePath: "/admin/live-courses",
  features: {
    lessonTypes: ["video", "text", "quiz", "assignment"],
    freePreview: true,
    quiz: true,
    assignment: true,
    preview: true,
    resources: false,
  },
};
