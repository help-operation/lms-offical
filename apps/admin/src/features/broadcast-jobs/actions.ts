"use server";

import { apiRequest } from "@/lib/api-client";
import type { BroadcastJob, BroadcastRecipient, RecipientSearchResult, StudentMessageHistoryRow } from "./types";

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

/** Every message a specific student has been sent, newest first -- used to check "have we already messaged this person". */
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
