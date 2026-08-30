import type {
  MeResponse,
  PhoneLoginInput,
  PhoneSignupInput,
  PhoneResetPasswordInput,
  SendOtpInput,
} from "@repo/validators";
import { apiRequest } from "@/lib/api-client";

export const authApi = {
  // Phone-based auth (web students)
  sendOtp: (data: SendOtpInput) =>
    apiRequest<null>("/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  phoneLogin: (data: PhoneLoginInput) =>
    apiRequest<null>("/auth/phone/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  phoneSignup: (data: PhoneSignupInput) =>
    apiRequest<null>("/auth/phone/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  phoneForgotPassword: (data: PhoneResetPasswordInput) =>
    apiRequest<null>("/auth/phone/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Combined email-or-phone auth (web students)
  accountSendOtp: (data: { identifier: string; purpose?: "signup" | "reset" }) =>
    apiRequest<null>("/auth/account/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  accountLogin: (data: { identifier: string; password: string }) =>
    apiRequest<null>("/auth/account/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  accountSignup: (data: {
    identifier: string;
    code: string;
    firstName: string;
    lastName: string;
    password: string;
  }) =>
    apiRequest<null>("/auth/account/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  accountForgotPassword: (data: {
    identifier: string;
    code: string;
    password: string;
  }) =>
    apiRequest<null>("/auth/account/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<null>("/auth/logout", { method: "POST" }),

  me: () =>
    apiRequest<MeResponse>("/auth/me"),
};
