"use server";

import { revalidatePath } from "next/cache";
import { pagesAdminApi } from "@/features/pages/api";
import { pageSectionsAdminApi } from "@/features/page-sections/api";
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

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function updatePageAction(slug: string, content: string) {
  try {
    const res = await pagesAdminApi.update(slug, content);
    revalidatePath(`/admin/pages/${slug}`);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// ─── Page Sections ────────────────────────────────────────────────────────────

export async function updatePageSectionAction(
  id: number,
  data: { label?: string; content?: Record<string, unknown> }
) {
  try {
    const res = await pageSectionsAdminApi.update(id, data);
    revalidatePath("/admin/content");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function togglePageSectionAction(id: number) {
  try {
    const res = await pageSectionsAdminApi.toggle(id);
    revalidatePath("/admin/content");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function reorderPageSectionsAction(items: { id: number; order: number }[]) {
  try {
    await pageSectionsAdminApi.reorder(items);
    revalidatePath("/admin/content");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deletePageSectionAction(id: number) {
  try {
    await pageSectionsAdminApi.delete(id);
    revalidatePath("/admin/content");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createPageSectionAction(data: {
  page: string;
  slug: string;
  label: string;
  type: string;
  order?: number;
  content?: Record<string, unknown>;
}) {
  try {
    const res = await pageSectionsAdminApi.create(data);
    revalidatePath("/admin/content");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
