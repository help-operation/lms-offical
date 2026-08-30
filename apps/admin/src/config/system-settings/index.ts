import { apiRequest } from "@/lib/api-client";

export const systemSettingsAdminApi = {
  getAll: () =>
    apiRequest<Record<string, string>>("/system-settings"),

  updateMany: (data: Record<string, string>) =>
    apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
