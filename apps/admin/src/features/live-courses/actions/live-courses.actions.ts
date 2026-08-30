"use server";

import { adminLiveCoursesApi, adminRecordedCoursesApi, liveCourseTeachersApi, type UpsertLiveCourseDto, type LiveCourseTeacher, type RecordedCourseSummary } from "@/features/live-courses/api";
import { validatePathFormat, type PathCheckResult } from "@/features/live-courses/path-validation";
import { revalidatePath } from "next/cache";

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function fetchTeachersAction(): Promise<{
  success: boolean; data: LiveCourseTeacher[]; message?: string;
}> {
  try {
    const res = await liveCourseTeachersApi.list();
    return { success: true, data: res.data ?? [] };
  } catch (err) {
    return { success: false, data: [], message: extractMessage(err) };
  }
}

export async function fetchRecordedCoursesAction(): Promise<{
  success: boolean; data: RecordedCourseSummary[]; message?: string;
}> {
  try {
    const res = await adminRecordedCoursesApi.list();
    return { success: true, data: res.data ?? [] };
  } catch (err) {
    return { success: false, data: [], message: extractMessage(err) };
  }
}

export async function fetchLiveCoursesAction(status?: string) {
  try {
    const res = await adminLiveCoursesApi.list(status);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function fetchLiveCourseAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.get(id);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

/**
 * Authoritative check for a live-course custom path: format + reserved-route +
 * DB uniqueness. The editor calls this (debounced) and blocks save on anything
 * other than "available".
 */
export async function checkLiveCoursePathAction(path: string, excludeId?: number): Promise<PathCheckResult> {
  const formatError = validatePathFormat(path);
  if (formatError) return formatError;
  try {
    const res = await adminLiveCoursesApi.checkSlug(path.trim(), excludeId);
    return res.data?.available
      ? { status: "available", message: "Available" }
      : { status: "taken", message: "Another course already uses this path." };
  } catch (err) {
    return { status: "invalid", message: extractMessage(err) };
  }
}

export async function createLiveCourseAction(data: UpsertLiveCourseDto) {
  try {
    const res = await adminLiveCoursesApi.create(data);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function updateLiveCourseAction(id: number, data: Partial<UpsertLiveCourseDto>) {
  try {
    const res = await adminLiveCoursesApi.update(id, data);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function toggleLiveCoursePublishAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.togglePublish(id);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function duplicateLiveCourseAction(id: number, includeCurriculum: boolean) {
  try {
    const res = await adminLiveCoursesApi.duplicate(id, includeCurriculum);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function deleteLiveCourseAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.delete(id);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function restoreLiveCourseAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.restore(id);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function purgeLiveCourseAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.purge(id);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function scheduleLiveCourseAction(id: number, publishAt: string) {
  try {
    const res = await adminLiveCoursesApi.schedule(id, publishAt);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function unscheduleLiveCourseAction(id: number) {
  try {
    const res = await adminLiveCoursesApi.unschedule(id);
    revalidatePath("/admin/live-courses");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}
