import { apiRequest } from "@/lib/api-client";
import type { InvoiceSettings } from "./types";

export type { InvoiceSettings } from "./types";
export { INVOICE_KEYS, INVOICE_DEFAULTS } from "./types";

export const invoiceSettingsApi = {
  get: () => apiRequest<Record<string, string>>("/system-settings"),
  update: (data: Partial<InvoiceSettings>) =>
    apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
