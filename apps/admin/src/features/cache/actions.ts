"use server";

import { apiRequest, ApiError } from "@/lib/api-client";

type PurgeResult =
  | { ok: true; tags: string[] }
  | { ok: false; reason: "disabled" | "failed"; tags: string[] };

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/** Trigger a global cache purge on the public web app via the API. */
export async function purgeAllCacheAction() {
  try {
    const res = await apiRequest<PurgeResult>("/cache/purge-all", {
      method: "POST",
    });
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
