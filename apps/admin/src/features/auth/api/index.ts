import type { MeResponse, EmailLoginInput } from "@repo/validators";
import { apiRequest } from "@/lib/api-client";

export const authApi = {
  login: (data: EmailLoginInput) =>
    apiRequest<null>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<null>("/auth/logout", { method: "POST" }),

  me: () =>
    apiRequest<MeResponse>("/auth/me"),

  // Request a password-reset link (always sent to the super admin's email).
  requestPasswordReset: () =>
    apiRequest<null>("/auth/forgot-password", { method: "POST" }),

  verifyResetToken: (token: string) =>
    apiRequest<{ valid: boolean }>(
      `/auth/reset-password/verify/${encodeURIComponent(token)}`,
    ),

  resetPassword: (data: {
    token: string;
    password: string;
    password_confirmation: string;
  }) =>
    apiRequest<null>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
