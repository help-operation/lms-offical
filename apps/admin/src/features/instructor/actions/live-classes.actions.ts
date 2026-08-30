"use server";

import { revalidatePath } from "next/cache";
import { liveClassAdminApi } from "@/features/instructor/api";
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

export async function createLiveClassAction(data: {
  title: string;
  description?: string;
  scheduledAt: string;
  meetingUrl?: string;
  courseId?: number;
}) {
  try {
    const res = await liveClassAdminApi.create(data);
    revalidatePath("/instructor/live-classes");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateLiveClassAction(
  id: number,
  data: {
    title?: string;
    description?: string;
    scheduledAt?: string;
    meetingUrl?: string;
    status?: "scheduled" | "live" | "ended" | "cancelled";
  }
) {
  try {
    const res = await liveClassAdminApi.update(id, data);
    revalidatePath("/instructor/live-classes");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
