"use server";

import { revalidatePath } from "next/cache";
import { storageConfigApi } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getStorageConfigAction() {
  try {
    const res = await storageConfigApi.list();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateStorageConfigAction(
  provider: string,
  credentials: Record<string, string>,
) {
  try {
    const res = await storageConfigApi.update(provider, { credentials });
    revalidatePath("/admin/settings/configaction");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
