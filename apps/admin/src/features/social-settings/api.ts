import { apiRequest } from "@/lib/api-client";
import type { SocialSettings } from "./types";

export type { SocialSettings } from "./types";
export { SOCIAL_KEYS, SOCIAL_DEFAULTS } from "./types";

export const socialSettingsApi = {
  get: () => apiRequest<Record<string, string>>("/system-settings"),
  update: (data: Partial<SocialSettings>) =>
    apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
