"use server";

import { redirect } from "next/navigation";
import type { EmailLoginInput } from "@repo/validators";
import { authApi } from "@/features/auth/api";
import { ApiError, type FieldError } from "@/lib/api-client";

export type ActionSuccess<T> = { success: true; message: string; data: T };
export type ActionError = { success: false; message: string; errors: FieldError[] | null };
export type ActionResult<T> = ActionSuccess<T> | ActionError;

export async function loginAction(data: EmailLoginInput): Promise<ActionResult<null>> {
  try {
    const result = await authApi.login(data);
    return { success: true, message: result.message, data: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: err.message, errors: err.errors };
    }
    return { success: false, message: "Something went wrong. Please try again.", errors: null };
  }
}

export async function requestPasswordResetAction(): Promise<ActionResult<null>> {
  try {
    const result = await authApi.requestPasswordReset();
    return { success: true, message: result.message, data: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: err.message, errors: err.errors };
    }
    return { success: false, message: "Something went wrong. Please try again.", errors: null };
  }
}

export async function verifyResetTokenAction(token: string): Promise<boolean> {
  try {
    const result = await authApi.verifyResetToken(token);
    return result.data?.valid === true;
  } catch {
    return false;
  }
}

export async function resetPasswordAction(data: {
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResult<null>> {
  try {
    const result = await authApi.resetPassword(data);
    return { success: true, message: result.message, data: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: err.message, errors: err.errors };
    }
    return { success: false, message: "Something went wrong. Please try again.", errors: null };
  }
}

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

// Form-action-compatible logout that always redirects to /login
export async function formLogoutAction(): Promise<void> {
  await authApi.logout().catch(() => null);
  redirect("/login");
}
