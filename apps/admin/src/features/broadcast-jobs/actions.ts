"use server";

import { apiRequest } from "@/lib/api-client";
import type { BroadcastJob, BroadcastRecipient, RecipientSearchResult, StudentMessageHistoryRow } from "./types";

export type { BroadcastJob, BroadcastRecipient, RecipientSearchResult, StudentMessageHistoryRow };

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

export async function listBroadcastJobsAction(limit = 100) {
  try {
    const res = await apiRequest<BroadcastJob[]>(`/broadcast-jobs?limit=${limit}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch send history" };
  }
}

/** Every message a specific student has been sent, newest first — used to check "have we already messaged this person". */
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
