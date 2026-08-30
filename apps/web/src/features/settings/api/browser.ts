import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { AccountProfile } from "./index";

export const settingsApiBrowser = {
  updateProfile: (data: { firstName: string; lastName: string; gender?: "male" | "female" | "other" }) =>
    apiRequestBrowser<AccountProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  avatarUploadUrl: (contentType: string) =>
    apiRequestBrowser<{ presignedUrl: string; publicUrl: string; key: string }>(
      "/profile/avatar/upload-url",
      {
        method: "POST",
        body: JSON.stringify({ contentType }),
      },
    ),

  updateAvatar: (avatar: string) =>
    apiRequestBrowser<AccountProfile>("/profile/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatar }),
    }),

  updateNotifications: (emailNotifications: boolean) =>
    apiRequestBrowser<AccountProfile>("/profile/notifications", {
      method: "PATCH",
      body: JSON.stringify({ emailNotifications }),
    }),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    apiRequestBrowser<{ success: boolean }>("/profile/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Add a contact method (email/phone) — OTP-verified, add-only.
  sendContactOtp: (data: { type: "email" | "phone"; value: string }) =>
    apiRequestBrowser<null>("/profile/contact/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyContact: (data: { type: "email" | "phone"; value: string; code: string }) =>
    apiRequestBrowser<AccountProfile>("/profile/contact/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
