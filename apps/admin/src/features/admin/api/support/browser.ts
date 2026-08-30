import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { AdminAgent, AdminTicket, AdminTicketDetail, SupportMessage, Attachment, CannedResponse } from "./index";

export const supportAdminApiBrowser = {
  getTicket: (id: number) =>
    apiRequestBrowser<AdminTicketDetail>(`/support/tickets/${id}`),
  reply: (id: number, data: { message: string; isInternal?: boolean; attachments?: Attachment[] }) =>
    apiRequestBrowser<SupportMessage>(`/support/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (
    id: number,
    data: { status: "open" | "in_progress" | "resolved" | "closed"; priority?: "low" | "medium" | "high" | "urgent" },
  ) =>
    apiRequestBrowser<AdminTicket>(`/support/admin/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  assign: (id: number, adminId: number | null) =>
    apiRequestBrowser<AdminTicket>(`/support/admin/tickets/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ adminId }),
    }),
  bulkAction: (data: { ids: number[]; action: string; adminId?: number | null; priority?: string }) =>
    apiRequestBrowser<{ updated: number }>("/support/admin/tickets/bulk", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  agents: () => apiRequestBrowser<AdminAgent[]>("/support/admin/agents"),
  attachmentUrl: (mimeType: string, fileName: string) =>
    apiRequestBrowser<{ presignedUrl: string; publicUrl: string; key: string }>("/support/attachment-url", {
      method: "POST",
      body: JSON.stringify({ mimeType, fileName }),
    }),
  createCanned: (data: { title: string; body: string; category?: string; sortOrder?: number }) =>
    apiRequestBrowser<CannedResponse>("/support/admin/canned-responses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCanned: (id: number, data: { title?: string; body?: string; category?: string; sortOrder?: number }) =>
    apiRequestBrowser<CannedResponse>(`/support/admin/canned-responses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCanned: (id: number) =>
    apiRequestBrowser<{ deleted: boolean }>(`/support/admin/canned-responses/${id}`, { method: "DELETE" }),
};
