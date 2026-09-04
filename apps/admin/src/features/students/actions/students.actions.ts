"use server";

import { revalidatePath } from "next/cache";
import { studentsApi } from "@/features/students/api";
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

export async function fetchStudentsStatsAction() {
  try {
    const res = await studentsApi.stats();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchStudentsAction(params: TableQueryParams) {
  try {
    const res = await studentsApi.list(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function toggleStudentStatusAction(id: number) {
  try {
    const res = await studentsApi.toggle(id);
    revalidatePath("/admin/students");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateStudentAction(
  id: number,
  data: { firstName?: string; lastName?: string; email?: string; phone?: string },
) {
  try {
    const res = await studentsApi.update(id, data);
    revalidatePath("/admin/students");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function resetStudentPasswordAction(id: number, password: string) {
  try {
    const res = await studentsApi.resetPassword(id, password);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteStudentAction(id: number) {
  try {
    await studentsApi.delete(id);
    revalidatePath("/admin/students");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchGuestsStatsAction() {
  try {
    const res = await studentsApi.guestStats();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchGuestsAction(params: TableQueryParams) {
  try {
    const res = await studentsApi.listGuests(params);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
