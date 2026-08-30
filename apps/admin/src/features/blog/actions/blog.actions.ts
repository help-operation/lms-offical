"use server";

import { revalidatePath } from "next/cache";
import { blogAdminApi } from "@/features/blog/api";
import type { TableQueryParams } from "@/features/admin/api";
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

export async function fetchBlogPostsAction(params?: TableQueryParams) {
  try {
    const res = await blogAdminApi.list(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createBlogPostAction(data: {
  title: string;
  excerpt?: string;
  content?: string;
  thumbnail?: string;
  categoryId?: number;
  publish?: boolean;
}) {
  try {
    const res = await blogAdminApi.create(data);
    revalidatePath("/admin/blog");
    // Public web cache is purged API-side (BlogService) — see RevalidationService.
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateBlogPostAction(
  id: number,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    thumbnail?: string;
    categoryId?: number | null;
    publish?: boolean;
  }
) {
  try {
    const res = await blogAdminApi.update(id, data);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}/edit`);
    // Public web cache is purged API-side (BlogService) — see RevalidationService.
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteBlogPostAction(id: number, slug?: string) {
  try {
    await blogAdminApi.remove(id);
    revalidatePath("/admin/blog");
    // Public web cache is purged API-side (BlogService) — see RevalidationService.
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
