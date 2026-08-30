import { apiRequestBrowser } from "@/lib/api-client-browser";

export const pushApi = {
  getVapidKey: () =>
    apiRequestBrowser<{ key: string }>("/push/vapid-public-key"),

  subscribe: (data: { endpoint: string; p256dh: string; auth: string }) =>
    apiRequestBrowser<void>("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unsubscribe: (endpoint: string) =>
    apiRequestBrowser<void>("/push/unsubscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
};
