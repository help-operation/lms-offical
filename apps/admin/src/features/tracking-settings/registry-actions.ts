"use server";

import { revalidatePath } from "next/cache";
import { trackingItemsApi, type UpdateTrackingItemInput } from "./registry-api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getTrackingItemsAction() {
  try {
    const res = await trackingItemsApi.list();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function bulkUpdateTrackingItemsAction(items: UpdateTrackingItemInput[]) {
  try {
    const res = await trackingItemsApi.bulkUpdate(items);
    revalidatePath("/admin/settings/tracking");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
