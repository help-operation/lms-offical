"use server";

import { uploadApi } from "@/lib/upload";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      return err.errors.map((e: { message: string }) => e.message).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getBunnyCredentialsAction(lessonId: number) {
  try {
    const res = await uploadApi.getBunnyCredentials(lessonId);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function setExternalUrlAction(lessonId: number, url: string, duration?: number) {
  try {
    const res = await uploadApi.setExternalUrl(lessonId, url, duration);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getThumbnailUploadUrlAction() {
  try {
    const res = await uploadApi.getThumbnailUploadUrl();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
