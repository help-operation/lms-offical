"use server";

import { revalidatePath } from "next/cache";
import { instructorProfileApi } from "@/features/courses/api";
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

export async function getInstructorProfileAction() {
  try {
    const res = await instructorProfileApi.get();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateInstructorProfileAction(data: {
  bio?: string;
  expertise?: string;
  displayName?: string | null;
  displayAvatar?: string | null;
}) {
  try {
    await instructorProfileApi.update(data);
    revalidatePath("/instructor/settings");
    return { success: true };
  } catch (err) {
    return { success: false, message: extractMessage(err) };
  }
}
