"use server";

import { apiRequest } from "@/lib/api-client";

export interface LiveCourseBatch {
  id: number;
  liveCourseId: number;
  batchName: string;
  status: "upcoming" | "active" | "ended";
  startDate?: string | null;
  endDate?: string | null;
  schedule?: string | null;
  supportSchedule?: string | null;
  maxSeats?: number | null;
  seatsFilled: number;
  countdownEnd?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Count of paid (completed) enrollments — batches with > 0 can't be deleted. */
  enrolledCount?: number;
}

export type BatchFormData = {
  batchName: string;
  status: "upcoming" | "active" | "ended";
  startDate?: string;
  endDate?: string;
  schedule?: string;
  supportSchedule?: string;
  maxSeats?: number | null;
  countdownEnd?: string;
  notes?: string;
};

// ── Server Actions ────────────────────────────────────────────────────────────

export async function listBatchesAction(
  courseId: number,
): Promise<{ success: boolean; data: LiveCourseBatch[]; message?: string }> {
  try {
    const res = await apiRequest<LiveCourseBatch[]>(
      `/admin/live-courses/${courseId}/batches`,
    );
    return { success: true, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false, data: [], message: err?.message ?? "Failed to fetch batches" };
  }
}

export async function createBatchAction(
  courseId: number,
  data: BatchFormData,
): Promise<{ success: boolean; data?: LiveCourseBatch; message?: string }> {
  try {
    const res = await apiRequest<LiveCourseBatch>(
      `/admin/live-courses/${courseId}/batches`,
      { method: "POST", body: JSON.stringify(data) },
    );
    return { success: true, data: res.data ?? undefined };
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Failed to create batch" };
  }
}

export async function updateBatchAction(
  courseId: number,
  batchId: number,
  data: Partial<BatchFormData>,
): Promise<{ success: boolean; data?: LiveCourseBatch; message?: string }> {
  try {
    const res = await apiRequest<LiveCourseBatch>(
      `/admin/live-courses/${courseId}/batches/${batchId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    );
    return { success: true, data: res.data ?? undefined };
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Failed to update batch" };
  }
}

export async function deleteBatchAction(
  courseId: number,
  batchId: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    await apiRequest(`/admin/live-courses/${courseId}/batches/${batchId}`, {
      method: "DELETE",
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Failed to delete batch" };
  }
}
