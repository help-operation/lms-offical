"use server";

import { revalidatePath } from "next/cache";
import {
  courseReviewsAdminApi,
  type CreateCuratedReviewPayload,
  type UpdateCuratedReviewPayload,
} from "@/features/courses/api/reviews";
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

/** Wrapped as Server Action so client modal can call it without importing the cookie-using api-client. */
export async function listCourseReviewsAction(courseId: number) {
  try {
    const res = await courseReviewsAdminApi.list(courseId);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCuratedReviewAction(
  courseId: number,
  data: CreateCuratedReviewPayload,
) {
  try {
    await courseReviewsAdminApi.create(courseId, data);
    revalidatePath("/admin/courses");
    revalidatePath("/course-builder");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCuratedReviewAction(
  reviewId: number,
  data: UpdateCuratedReviewPayload,
) {
  try {
    await courseReviewsAdminApi.update(reviewId, data);
    revalidatePath("/admin/courses");
    revalidatePath("/course-builder");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteReviewAction(reviewId: number) {
  try {
    await courseReviewsAdminApi.delete(reviewId);
    revalidatePath("/admin/courses");
    revalidatePath("/course-builder");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
