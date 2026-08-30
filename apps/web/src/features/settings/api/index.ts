import { apiRequest } from "@/lib/api-client";

export interface AccountProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  avatar: string | null;
  gender: "male" | "female" | "other" | null;
  emailNotifications: boolean;
  /** True when the account already has a password set (vs. OTP-only). */
  hasPassword: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export const settingsApi = {
  get: () => apiRequest<AccountProfile>("/profile"),
};
