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
}

export interface BroadcastRecipient {
  id: number;
  studentId: number;
  recipient: string;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  firstName: string;
  lastName: string;
}

export interface StudentMessageHistoryRow {
  id: number;
  jobId: number;
  recipient: string;
  status: BroadcastRecipientStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  createdAt: string | null;
}

export interface RecipientSearchResult extends StudentMessageHistoryRow {
  studentId: number;
  firstName: string;
  lastName: string;
}
