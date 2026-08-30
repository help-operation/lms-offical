import { apiRequest } from "@/lib/api-client";

export const systemSettingsApi = {
  getPublic: (keys: string[]) =>
    apiRequest<Record<string, string>>(
      `/system-settings/public?keys=${keys.join(",")}`,
    ),
};
