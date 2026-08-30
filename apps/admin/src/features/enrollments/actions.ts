"use server";

import { apiRequest } from "@/lib/api-client";
import type {
  EnrollmentsResponse,
  EnrollUser,
  EnrollCourseOption,
  EnrollLiveOption,
  EnrollBatchOption,
  ManualEnrollPayload,
  StudentEnrollmentsData,
  EnrollmentPaymentSummary,
} from "./types";

export interface EnrollmentsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  type?: "recorded" | "live" | "all";
}

export async function getEnrollmentsAction(params: EnrollmentsQuery = {}) {
  try {
    const q = new URLSearchParams();
    if (params.page)     q.set("page",     String(params.page));
    if (params.per_page) q.set("per_page", String(params.per_page));
    if (params.search)   q.set("search",   params.search);
    if (params.status)   q.set("status",   params.status);
    if (params.type)     q.set("type",     params.type);

    const qs = q.toString();
    const res = await apiRequest<EnrollmentsResponse>(`/admin/enrollments${qs ? `?${qs}` : ""}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch enrollments" };
  }
}

// ── Manual enrollment pickers + create ─────────────────────────────────────

export async function searchEnrollUsersAction(search: string) {
  try {
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const res = await apiRequest<EnrollUser[]>(`/admin/enrollments/picker/users${qs}`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to search users" };
  }
}

export async function getRecordedCourseOptionsAction() {
  try {
    const res = await apiRequest<EnrollCourseOption[]>(`/admin/enrollments/picker/recorded-courses`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to load courses" };
  }
}

export async function getLiveCourseOptionsAction() {
  try {
    const res = await apiRequest<EnrollLiveOption[]>(`/admin/enrollments/picker/live-courses`);
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to load live courses" };
  }
}

export async function getLiveBatchOptionsAction(liveCourseId: number) {
  try {
    const res = await apiRequest<EnrollBatchOption[]>(
      `/admin/enrollments/picker/batches?liveCourseId=${liveCourseId}`,
    );
    return { success: true as const, data: res.data ?? [] };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to load batches" };
  }
}

export async function createManualEnrollmentAction(payload: ManualEnrollPayload) {
  try {
    const res = await apiRequest<{ success: boolean; userId: number; tempPassword: string | null; alreadyExisted?: boolean }>(
      `/admin/enrollments`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    return { success: true as const, data: res.data };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to enroll student" };
  }
}

// ── Enrollment Management ──────────────────────────────────────────────────

export async function getStudentEnrollmentsAction(userId: number) {
  try {
    const res = await apiRequest<StudentEnrollmentsData>(`/admin/enrollments/student/${userId}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch enrollments" };
  }
}

export async function removeRecordedEnrollmentAction(id: number) {
  try {
    await apiRequest(`/admin/enrollments/recorded/${id}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to remove enrollment" };
  }
}

export async function removeLiveEnrollmentAction(id: number) {
  try {
    await apiRequest(`/admin/enrollments/live/${id}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to remove live enrollment" };
  }
}

export async function toggleRecordedSuspendAction(id: number, reason?: string) {
  try {
    const res = await apiRequest<{ id: number; status: string }>(
      `/admin/enrollments/recorded/${id}/suspend`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update status" };
  }
}

export async function toggleLiveSuspendAction(id: number, reason?: string) {
  try {
    const res = await apiRequest<{ id: number; status: string }>(
      `/admin/enrollments/live/${id}/suspend`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update status" };
  }
}

export async function setRecordedExpiryAction(id: number, expiresAt: string | null) {
  try {
    const res = await apiRequest<{ id: number; expiresAt: string | null }>(
      `/admin/enrollments/recorded/${id}/expiry`,
      { method: "PATCH", body: JSON.stringify({ expiresAt }) },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to set expiry" };
  }
}

export async function setLiveExpiryAction(id: number, expiresAt: string | null) {
  try {
    const res = await apiRequest<{ id: number; expiresAt: string | null }>(
      `/admin/enrollments/live/${id}/expiry`,
      { method: "PATCH", body: JSON.stringify({ expiresAt }) },
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to set expiry" };
  }
}

// ── Payments (Paid / Partial / Due) ────────────────────────────────────────

export async function getEnrollmentPaymentsAction(courseType: "recorded" | "live", id: number) {
  try {
    const res = await apiRequest<EnrollmentPaymentSummary>(`/admin/enrollments/${courseType}/${id}/payments`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch payment history" };
  }
}

export async function recordEnrollmentPaymentAction(
  courseType: "recorded" | "live",
  id: number,
  body: { amount: number; method?: string; bkashTrxId?: string; payerPhone?: string },
) {
  try {
    const res = await apiRequest<EnrollmentPaymentSummary>(`/admin/enrollments/${courseType}/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to record payment" };
  }
}
