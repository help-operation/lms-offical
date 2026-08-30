"use server";

import { revalidatePath } from "next/cache";
import { generalSettingsApi, type GeneralSettings } from "./api";
import { ApiError } from "@/lib/api-client";
import { Buffer } from "node:buffer";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getGeneralSettingsAction() {
  try {
    const res = await generalSettingsApi.get();
    return { success: true as const, data: res.data as Record<string, string> };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/** Fetches an image URL on the server (no CORS) and returns a base64 data URL */
export async function fetchLogoBase64Action(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function updateGeneralSettingsAction(data: Partial<GeneralSettings>) {
  try {
    const res = await generalSettingsApi.update(data);
    revalidatePath("/admin/settings/general");
    revalidatePath("/", "layout");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
