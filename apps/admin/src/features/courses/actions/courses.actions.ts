"use server";

import { revalidatePath } from "next/cache";
import { instructorCoursesApi, modulesApi, lessonsApi, type LessonType, type CourseDetailPageInput } from "@/features/courses/api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      return err.errors.map((e) => e.message).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function createCourseAction(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const categoryIdRaw = formData.get("categoryId") as string;
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
  const level = formData.get("level") as string;
  const language = (formData.get("language") as string) || "Bangla";
  const priceRaw = formData.get("price") as string;
  const price = priceRaw !== "" ? Number(priceRaw) : 0;
  const discountPriceRaw = formData.get("discountPrice") as string;
  const discountPrice = discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined;

  try {
    const res = await instructorCoursesApi.create({
      title,
      description,
      categoryId,
      level,
      language,
      price,
      discountPrice,
    });
    revalidatePath("/course-builder");
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCourseWithTemplateAction(formData: FormData, template?: "1" | "2") {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const categoryIdRaw = formData.get("categoryId") as string;
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
  const level = (formData.get("level") as string) || "beginner";
  const language = (formData.get("language") as string) || "English";
  const priceRaw = formData.get("price") as string;
  const price = priceRaw !== "" ? Number(priceRaw) : 0;
  const discountPriceRaw = formData.get("discountPrice") as string;
  const discountPrice = discountPriceRaw !== "" ? Number(discountPriceRaw) : undefined;
  const formTemplate = (formData.get("template") as "1" | "2") || template || "1";
  const courseType = (formData.get("courseType") as "single" | "bundle") || undefined;
  const bundledRaw = formData.get("bundledCourseIds") as string | null;
  let bundledCourseIds: number[] | undefined;
  if (bundledRaw) {
    try { const arr = JSON.parse(bundledRaw); if (Array.isArray(arr)) bundledCourseIds = arr.map(Number).filter(n=>!isNaN(n)); } catch {}
  }
  const bundleCurriculumRaw = formData.get("bundleCurriculum") as string | null;
  let bundleCurriculum: Array<{ title: string; lessons: string[] }> | undefined;
  if (bundleCurriculumRaw) {
    try { const arr = JSON.parse(bundleCurriculumRaw); if (Array.isArray(arr)) bundleCurriculum = arr; } catch {}
  }
  const bundleHeaderRaw = formData.get("bundleCurriculumHeader") as string | null;
  let bundleCurriculumHeader: { title?: string; moduleLabel?: string; courseTypeLabel?: string } | undefined;
  if (bundleHeaderRaw) {
    try { const obj = JSON.parse(bundleHeaderRaw); if (obj && typeof obj === "object") bundleCurriculumHeader = obj; } catch {}
  }
  const masteryCheckoutImageRaw = formData.get("masteryCheckoutImage") as string | null;
  const masteryCheckoutImage = masteryCheckoutImageRaw !== null ? (masteryCheckoutImageRaw || null) : undefined;

  try {
    const res = await instructorCoursesApi.create({
      title,
      description,
      categoryId,
      level,
      language,
      price,
      discountPrice,
      template: formTemplate,
      ...(courseType ? { courseType } : {}),
      ...(bundledCourseIds ? { bundledCourseIds } : {}),
      ...(bundleCurriculum ? { bundleCurriculum } : {}),
      ...(bundleCurriculumHeader ? { bundleCurriculumHeader } : {}),
      ...(masteryCheckoutImage !== undefined ? { masteryCheckoutImage } : {}),
    });
    
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCourseAction(
  id: number,
  data: Record<string, any>
) {
  try {
    await instructorCoursesApi.update(id, data as any);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function updateCourseDetailPageAction(
  id: number,
  data: CourseDetailPageInput,
) {
  try {
    await instructorCoursesApi.update(id, data as any);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCourseThumbnailAction(
  id: number,
  thumbnail: string | null,
) {
  try {
    await instructorCoursesApi.update(id, { thumbnail } as any);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteCourseAction(id: number) {
  try {
    await instructorCoursesApi.remove(id);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function restoreCourseAction(id: number) {
  try {
    await instructorCoursesApi.restore(id);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function purgeCourseAction(id: number) {
  try {
    await instructorCoursesApi.purge(id);
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function scheduleCourseAction(id: number, publishAt: string) {
  try {
    await instructorCoursesApi.schedule(id, publishAt);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function unscheduleCourseAction(id: number) {
  try {
    await instructorCoursesApi.unschedule(id);
    revalidatePath("/course-builder");
    revalidatePath("/admin/courses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCoursePreviewAction(
  id: number,
  data: {
    previewVideoSource?: "bunny" | "external";
    previewExternalUrl?: string;
    bunnyPreviewVideoId?: string;
  }
) {
  try {
    await instructorCoursesApi.updatePreview(id, data);
    revalidatePath("/course-builder");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function duplicateCourseAction(id: number, includeCurriculum: boolean) {
  try {
    const res = await instructorCoursesApi.duplicate(id, includeCurriculum);
    revalidatePath("/course-builder");
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function publishCourseAction(id: number) {
  try {
    await instructorCoursesApi.publish(id);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function unpublishCourseAction(id: number) {
  try {
    await instructorCoursesApi.unpublish(id);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function createModuleAction(courseId: number, title: string) {
  try {
    const res = await modulesApi.create(courseId, { title });
    revalidatePath("/course-builder");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function updateModuleAction(
  courseId: number,
  moduleId: number,
  data: { title?: string; description?: string }
) {
  try {
    await modulesApi.update(courseId, moduleId, data);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function deleteModuleAction(courseId: number, moduleId: number) {
  try {
    await modulesApi.remove(courseId, moduleId);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function reorderModulesAction(courseId: number, orderedIds: { id: number; order: number }[]) {
  try {
    await modulesApi.reorder(courseId, orderedIds);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function createLessonAction(
  courseId: number,
  moduleId: number,
  data: { title: string; type?: LessonType; content?: string; isFree?: boolean }
) {
  try {
    const res = await lessonsApi.create(moduleId, data);
    revalidatePath("/course-builder");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function updateLessonAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
  data: { title?: string; type?: LessonType; content?: string; isFree?: boolean; duration?: number }
) {
  try {
    await lessonsApi.update(moduleId, lessonId, data);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function reorderLessonsAction(
  courseId: number,
  moduleId: number,
  orderedIds: { id: number; order: number }[]
) {
  try {
    await lessonsApi.reorder(moduleId, orderedIds);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}

export async function deleteLessonAction(
  courseId: number,
  moduleId: number,
  lessonId: number
) {
  try {
    await lessonsApi.remove(moduleId, lessonId);
    revalidatePath("/course-builder");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}
