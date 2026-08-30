import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { ContactMessage } from "../types";

export const contactMessagesApiBrowser = {
  markRead: (id: number) =>
    apiRequestBrowser<ContactMessage>(`/contact-messages/admin/${id}/read`, { method: "PATCH" }),

  delete: (id: number) =>
    apiRequestBrowser(`/contact-messages/admin/${id}`, { method: "DELETE" }),
};
