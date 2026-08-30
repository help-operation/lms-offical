"use server";

import { adminLiveCurriculumApi } from "@/features/live-courses/api";
import { revalidatePath } from "next/cache";

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function revalidate(courseId: number) {
  revalidatePath(`/admin/live-courses/${courseId}/edit`);
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function fetchLiveCourseModulesAction(courseId: number) {
  try {
    const res = await adminLiveCurriculumApi.getModules(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function createLiveCourseModuleAction(courseId: number, title: string) {
  try {
    const res = await adminLiveCurriculumApi.createModule(courseId, title);
    revalidate(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function updateLiveCourseModuleAction(courseId: number, moduleId: number, title: string) {
  try {
    const res = await adminLiveCurriculumApi.updateModule(moduleId, title);
    revalidate(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function deleteLiveCourseModuleAction(courseId: number, moduleId: number) {
  try {
    await adminLiveCurriculumApi.deleteModule(moduleId);
    revalidate(courseId);
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function reorderLiveCourseModulesAction(
  courseId: number,
  order: { id: number; order: number }[],
) {
  try {
    await adminLiveCurriculumApi.reorderModules(courseId, order);
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function createLiveCourseLessonAction(
  courseId: number,
  moduleId: number,
  data: { title: string; type?: string; content?: string; isFree?: boolean },
) {
  try {
    const res = await adminLiveCurriculumApi.createLesson(moduleId, data);
    revalidate(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function updateLiveCourseLessonAction(
  courseId: number,
  lessonId: number,
  data: Record<string, unknown>,
) {
  try {
    const res = await adminLiveCurriculumApi.updateLesson(lessonId, data as any);
    revalidate(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function deleteLiveCourseLessonAction(courseId: number, lessonId: number) {
  try {
    await adminLiveCurriculumApi.deleteLesson(lessonId);
    revalidate(courseId);
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function reorderLiveCourseLessonsAction(
  moduleId: number,
  order: { id: number; order: number }[],
) {
  try {
    await adminLiveCurriculumApi.reorderLessons(moduleId, order);
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function getLiveLessonBunnyCredentialsAction(lessonId: number) {
  try {
    const res = await adminLiveCurriculumApi.getBunnyCredentials(lessonId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}

export async function setLiveLessonExternalUrlAction(
  courseId: number,
  lessonId: number,
  url: string,
  duration?: number,
) {
  try {
    const res = await adminLiveCurriculumApi.setExternalUrl(lessonId, url, duration);
    revalidate(courseId);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err), data: null };
  }
}
