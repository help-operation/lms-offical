export type BroadcastChannel = "sms" | "email";
export type BroadcastJobStatus = "scheduled" | "pending" | "running" | "completed" | "cancelled";
export type BroadcastRecipientStatus = "pending" | "queued" | "sent" | "delivered" | "failed" | "cancelled";

export interface BroadcastJob {
  id: number;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  total: number;
  sent: number;
  failed: number;
  status: BroadcastJobStatus;
  scheduledAt: string | null;
  intervalSeconds: number | null;
  lastSentAt: string | null;
  createdByAdminId: number | null;
  createdAt: string | null;
  completedAt: string | null;
  adminFirstName?: string | null;
  adminLastName?: string | null;
}

export interface BroadcastRecipient {
  id: number;
  studentId: number;
  recipient: string;
  renderedMessage: string | null;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  sentByAdminId: number | null;
  createdAt: string | null;
  firstName: string;
  lastName: string;
  adminFirstName?: string | null;
  adminLastName?: string | null;
}

export interface MessageHistoryRow {
  id: number;
  jobId: number;
  studentId: number;
  recipient: string;
  renderedMessage: string | null;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  sentByAdminId: number | null;
  createdAt: string | null;
  firstName: string;
  lastName: string;
  adminFirstName: string | null;
  adminLastName: string | null;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  jobStatus: BroadcastJobStatus;
  jobCreatedAt: string | null;
}

export interface MessageHistoryResponse {
  rows: MessageHistoryRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageDetail extends MessageHistoryRow {
  email: string | null;
  phone: string | null;
  jobScheduledAt: string | null;
  jobIntervalSeconds: number | null;
}

export interface StudentMessageHistoryRow {
  id: number;
  jobId: number;
  recipient: string;
  renderedMessage: string | null;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  sentByAdminId: number | null;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  createdAt: string | null;
  adminFirstName: string | null;
  adminLastName: string | null;
}

export interface RecipientSearchResult {
  id: number;
  jobId: number;
  studentId: number;
  recipient: string;
  renderedMessage: string | null;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  sentByAdminId: number | null;
  firstName: string;
  lastName: string;
  adminFirstName: string | null;
  adminLastName: string | null;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  createdAt: string | null;
}
