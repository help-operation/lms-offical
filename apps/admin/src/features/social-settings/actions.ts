"use server";

import { revalidatePath } from "next/cache";
import { socialSettingsApi, type SocialSettings } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getSocialSettingsAction() {
  try {
    const res = await socialSettingsApi.get();
    return { success: true as const, data: res.data as Record<string, string> };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateSocialSettingsAction(data: Partial<SocialSettings>) {
  try {
    const res = await socialSettingsApi.update(data);
    revalidatePath("/admin/settings/social-links");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
