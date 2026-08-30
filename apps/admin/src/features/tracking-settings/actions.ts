"use server";

import { revalidatePath } from "next/cache";
import { trackingSettingsApi, type UpdateTrackingSettingsInput } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getTrackingSettingsAction() {
  try {
    const res = await trackingSettingsApi.get();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateTrackingSettingsAction(data: UpdateTrackingSettingsInput) {
  try {
    const res = await trackingSettingsApi.update(data);
    revalidatePath("/admin/settings/tracking");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
