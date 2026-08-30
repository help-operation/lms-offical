"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getMaintenanceSettingsAction() {
  try {
    const res = await apiRequest<Record<string, string>>(
      "/system-settings/public?keys=maintenance_enabled,maintenance_message",
    );
    return { success: true as const, data: res.data ?? {} };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function setMaintenanceEnabledAction(enabled: boolean) {
  try {
    await apiRequest(`/system-settings/maintenance_enabled`, {
      method: "PUT",
      body: JSON.stringify({ value: String(enabled) }),
    });
    revalidatePath("/admin/settings/maintenance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function setMaintenanceMessageAction(message: string) {
  try {
    await apiRequest(`/system-settings/maintenance_message`, {
      method: "PUT",
      body: JSON.stringify({ value: message }),
    });
    revalidatePath("/admin/settings/maintenance");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
