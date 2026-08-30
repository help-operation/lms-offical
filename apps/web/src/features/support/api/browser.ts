import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { Attachment, SupportTicket, SupportTicketDetail, SupportMessage } from "./index";

export const supportApiBrowser = {
  create: (data: { subject: string; message: string; category?: string; priority?: string }) =>
    apiRequestBrowser<SupportTicket>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTicket: (id: number) =>
    apiRequestBrowser<SupportTicketDetail>(`/support/tickets/${id}`),
  reply: (id: number, data: { message: string; attachments?: Attachment[] }) =>
    apiRequestBrowser<SupportMessage>(`/support/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  attachmentUrl: (mimeType: string, fileName: string) =>
    apiRequestBrowser<{ presignedUrl: string; publicUrl: string; key: string }>("/support/attachment-url", {
      method: "POST",
      body: JSON.stringify({ mimeType, fileName }),
    }),
};
