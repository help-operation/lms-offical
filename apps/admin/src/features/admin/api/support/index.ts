import { apiRequest } from "@/lib/api-client";

export interface AdminAgent {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Attachment {
  url: string;
  name: string;
}

export interface AdminTicket {
  id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  slaBreach: boolean;
  assignedTo: number | null;
  assignedAdminFirstName: string | null;
  assignedAdminLastName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userId: number;
  userFirstName: string;
  userLastName: string;
  unread?: boolean;
}

export interface SupportMessage {
  id: number;
  message: string;
  isInternal: boolean;
  attachments: Attachment[] | null;
  createdAt: string | null;
  userId: number;
  userFirstName: string;
  userLastName: string;
}

export interface AdminTicketDetail extends AdminTicket {
  messages: SupportMessage[];
}

export interface AdminTicketsResponse {
  data: AdminTicket[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface SupportStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  sla_breached: number;
  unassigned: number;
  total: number;
  by_agent: { id: number; name: string; count: number }[];
}

export interface SupportAnalytics {
  period: number;
  summary: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    avgResolutionHours: number | null;
    slaCompliancePct: number;
    resolvedTotal: number;
  };
  trend: { date: string; created: number }[];
  byCategory: { category: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  agentPerformance: {
    id: number;
    name: string;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionHours: number | null;
  }[];
}

export interface CannedResponse {
  id: number;
  title: string;
  body: string;
  category: string;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export const supportAdminApi = {
  tickets: (qs = "") =>
    apiRequest<AdminTicketsResponse>(`/support/admin/tickets${qs ? `?${qs}` : ""}`),
  getTicket: (id: number) =>
    apiRequest<AdminTicketDetail>(`/support/tickets/${id}`),
  stats: () =>
    apiRequest<SupportStats>("/support/admin/stats"),
  reply: (id: number, data: { message: string; isInternal?: boolean; attachments?: Attachment[] }) =>
    apiRequest<SupportMessage>(`/support/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (
    id: number,
    data: { status: "open" | "in_progress" | "resolved" | "closed"; priority?: "low" | "medium" | "high" | "urgent" },
  ) =>
    apiRequest<AdminTicket>(`/support/admin/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  assign: (id: number, adminId: number | null) =>
    apiRequest<AdminTicket>(`/support/admin/tickets/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ adminId }),
    }),
  bulkAction: (data: { ids: number[]; action: string; adminId?: number | null; priority?: string }) =>
    apiRequest<{ updated: number }>("/support/admin/tickets/bulk", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  agents: () => apiRequest<AdminAgent[]>("/support/admin/agents"),
  attachmentUrl: (mimeType: string, fileName: string) =>
    apiRequest<{ presignedUrl: string; publicUrl: string; key: string }>("/support/attachment-url", {
      method: "POST",
      body: JSON.stringify({ mimeType, fileName }),
    }),
  // Analytics
  analytics: (days = 30) =>
    apiRequest<SupportAnalytics>(`/support/admin/analytics?days=${days}`),

  // Canned responses
  listCanned: () =>
    apiRequest<CannedResponse[]>("/support/admin/canned-responses"),
  createCanned: (data: { title: string; body: string; category?: string; sortOrder?: number }) =>
    apiRequest<CannedResponse>("/support/admin/canned-responses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCanned: (id: number, data: { title?: string; body?: string; category?: string; sortOrder?: number }) =>
    apiRequest<CannedResponse>(`/support/admin/canned-responses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCanned: (id: number) =>
    apiRequest<{ deleted: boolean }>(`/support/admin/canned-responses/${id}`, { method: "DELETE" }),
};
