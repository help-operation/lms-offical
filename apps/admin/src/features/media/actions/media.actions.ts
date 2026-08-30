"use server";

import { revalidatePath } from "next/cache";
import { mediaAdminApi } from "@/features/media/api/media.api";
import { ApiError } from "@/lib/api-client";
import type { MediaFile, MediaListParams } from "@/features/media/types";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error)    return err.message;
  return "Something went wrong";
}

// ─── Presign: step 1 — get a presigned PUT URL for one file ───────────────────
// Called from the client, runs on the Next.js server so it can forward the
// auth cookie to the NestJS API via apiRequest.

export async function presignMediaAction(mimeType: string, filename: string) {
  try {
    const res = await mediaAdminApi.presign(mimeType, filename);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Register: step 2 — save file record after browser completes the R2 PUT ───

export async function registerMediaAction(data: {
  url:          string;
  key:          string;
  filename:     string;
  originalName: string;
  mimeType:     string;
  size:         number;
}) {
  try {
    const res = await mediaAdminApi.register(data);
    revalidatePath("/admin/media");
    return { success: true as const, data: res.data as MediaFile };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Update metadata ──────────────────────────────────────────────────────────

export async function updateMediaAction(
  id: number,
  data: { filename?: string; altText?: string; caption?: string },
) {
  try {
    const res = await mediaAdminApi.update(id, data);
    revalidatePath("/admin/media");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Delete one ───────────────────────────────────────────────────────────────

export async function deleteMediaAction(id: number) {
  try {
    await mediaAdminApi.delete(id);
    revalidatePath("/admin/media");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Bulk delete ──────────────────────────────────────────────────────────────

export async function bulkDeleteMediaAction(ids: number[]) {
  try {
    const res = await mediaAdminApi.bulkDelete(ids);
    revalidatePath("/admin/media");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Fetch list (for picker modal) ────────────────────────────────────────────

export async function fetchMediaListAction(params?: MediaListParams) {
  try {
    const res = await mediaAdminApi.list(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
