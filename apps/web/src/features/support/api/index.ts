import { apiRequest } from "@/lib/api-client";

export interface Attachment {
  url: string;
  name: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string | null;
  updatedAt: string | null;
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

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

// Server-side (cookie-forwarding) client — used by Server Components.
export const supportApi = {
  myTickets: () => apiRequest<SupportTicket[]>("/support/tickets"),
};
