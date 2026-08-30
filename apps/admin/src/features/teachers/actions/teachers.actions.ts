"use server";

import { revalidatePath } from "next/cache";
import { teachersApi } from "@/features/teachers/api";
import type { TableQueryParams } from "@/features/admin/api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0)
      return err.errors.map((e: { message: string }) => e.message).join(", ");
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function fetchTeachersAction(params: TableQueryParams) {
  try {
    const res = await teachersApi.list(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function toggleTeacherStatusAction(id: number) {
  try {
    const res = await teachersApi.toggle(id);
    revalidatePath("/admin/teachers");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateTeacherAction(
  id: number,
  data: { firstName?: string; lastName?: string; email?: string },
) {
  try {
    const res = await teachersApi.update(id, data);
    revalidatePath("/admin/teachers");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function resetTeacherPasswordAction(id: number, password: string) {
  try {
    const res = await teachersApi.resetPassword(id, password);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteTeacherAction(id: number) {
  try {
    await teachersApi.delete(id);
    revalidatePath("/admin/teachers");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
