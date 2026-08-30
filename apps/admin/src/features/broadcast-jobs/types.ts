export type BroadcastChannel = "sms" | "email";
export type BroadcastJobStatus = "pending" | "running" | "completed";
export type BroadcastRecipientStatus = "pending" | "sent" | "failed";

export interface BroadcastJob {
  id: number;
  channel: BroadcastChannel;
  subject: string | null;
  message: string;
  total: number;
  sent: number;
  failed: number;
  status: BroadcastJobStatus;
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
