import { apiRequest } from "@/lib/api-client";
import type { GeneralSettings } from "./types";

export type { GeneralSettings } from "./types";
export { GENERAL_KEYS, GENERAL_DEFAULTS } from "./types";

export const generalSettingsApi = {
  get: () => apiRequest<Record<string, string>>("/system-settings"),
  getPublic: (keys: string[]) =>
    apiRequest<Record<string, string>>(
      `/system-settings/public?keys=${keys.join(",")}`,
    ),
  update: (data: Partial<GeneralSettings>) =>
    apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
