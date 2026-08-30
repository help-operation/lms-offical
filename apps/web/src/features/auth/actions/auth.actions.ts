"use server";

import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { ApiError, type FieldError } from "@/lib/api-client";

export type ActionSuccess<T> = { success: true; message: string; data: T };
export type ActionError = { success: false; message: string; errors: FieldError[] | null };
export type ActionResult<T> = ActionSuccess<T> | ActionError;

export async function logoutAction(): Promise<ActionResult<null>> {
  try {
    const result = await authApi.logout();
    return { success: true, message: result.message, data: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: err.message, errors: err.errors };
    }
    return { success: false, message: "Something went wrong. Please try again.", errors: null };
  }
}

export async function formLogoutAction(): Promise<void> {
  await authApi.logout().catch(() => null);
  redirect("/login");
}
