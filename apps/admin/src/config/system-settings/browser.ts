import { apiRequestBrowser } from "@/lib/api-client-browser";

export const systemSettingsAdminApiBrowser = {
  updateMany: (data: Record<string, string>) =>
    apiRequestBrowser<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
