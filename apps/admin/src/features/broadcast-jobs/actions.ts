"use server";

import { apiRequest } from "@/lib/api-client";
import type {
  BroadcastJob,
  BroadcastRecipient,
  MessageHistoryResponse,
  MessageDetail,
  RecipientSearchResult,
  StudentMessageHistoryRow,
} from "./types";

export async function getBroadcastJobAction(jobId: number) {
  try {
    const res = await apiRequest<BroadcastJob>(`/broadcast-jobs/${jobId}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch job" };
  }
}

export async function getBroadcastJobRecipientsAction(jobId: number) {
  try {
    const res = await apiRequest<BroadcastRecipient[]>(`/broadcast-jobs/${jobId}/recipients`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch recipients" };
  }
}

export async function listBroadcastJobsAction(limit = 100, status?: string) {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status && status !== "all") params.set("status", status);
    const res = await apiRequest<BroadcastJob[]>(`/broadcast-jobs?${params}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch send history" };
  }
}

export async function cancelBroadcastJobAction(jobId: number) {
  try {
    await apiRequest(`/broadcast-jobs/${jobId}/cancel`, { method: "POST" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to cancel job" };
  }
}

export async function getMessageHistoryAction(params: {
  limit?: number;
  offset?: number;
  status?: string;
  channel?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  jobId?: number;
}) {
  try {
    const sp = new URLSearchParams();
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.offset) sp.set("offset", String(params.offset));
    if (params.status && params.status !== "all") sp.set("status", params.status);
    if (params.channel && params.channel !== "all") sp.set("channel", params.channel);
    if (params.search) sp.set("search", params.search);
    if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
    if (params.dateTo) sp.set("dateTo", params.dateTo);
    if (params.jobId) sp.set("jobId", String(params.jobId));
    const res = await apiRequest<MessageHistoryResponse>(`/broadcast-jobs/history?${sp}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch message history" };
  }
}

export async function getMessageDetailAction(recipientId: number) {
  try {
    const res = await apiRequest<MessageDetail>(`/broadcast-jobs/detail/${recipientId}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch message detail" };
  }
}

export async function resendMessageAction(recipientId: number) {
  try {
    const res = await apiRequest<{ newRecipientId: number; channel: string }>(
      `/broadcast-jobs/resend/${recipientId}`,
      { method: "POST" },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to resend message" };
  }
}

export async function exportMessageHistoryAction(params: {
  channel?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  jobId?: number;
}) {
  try {
    const sp = new URLSearchParams();
    if (params.channel && params.channel !== "all") sp.set("channel", params.channel);
    if (params.status && params.status !== "all") sp.set("status", params.status);
    if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
    if (params.dateTo) sp.set("dateTo", params.dateTo);
    if (params.jobId) sp.set("jobId", String(params.jobId));
    const res = await apiRequest<any[]>(`/broadcast-jobs/export?${sp}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to export" };
  }
}

/** Every message a specific student has been sent, newest first. */
export async function getStudentMessageHistoryAction(studentId: number) {
  try {
    const res = await apiRequest<StudentMessageHistoryRow[]>(`/broadcast-jobs/student/${studentId}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch student history" };
  }
}

/** Finds past sends by student name or the phone/email actually used. */
export async function searchBroadcastRecipientsAction(query: string) {
  try {
    const res = await apiRequest<RecipientSearchResult[]>(`/broadcast-jobs/search?query=${encodeURIComponent(query)}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to search history" };
  }
}
