"use server";

import { studentsApi } from "@/features/students/api";
import { apiRequest, ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0)
      return err.errors.map((e: { message: string }) => e.message).join(", ");
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/**
 * Pulls a large page of real students for client-side filtering. The backend
 * supports search/status/date-range/payment-status/last-login filters on
 * GET /admin/students, but not course/batch/enrollment-status yet, so we
 * fetch a broad set once and filter with the enriched fields client-side.
 */
export async function fetchStudentsForFilterAction() {
  try {
    const res = await studentsApi.list({ per_page: 100000, sort_field: "createdAt", sort_direction: "desc" });
    return { success: true as const, data: res.data.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export type EnrollmentSummaryRow = {
  userId: number;
  courseType: "live" | "recorded";
  courseName: string;
  batchName: string | null;
  enrollmentStatus: string;
  lastLoginAt: string | null;
  paymentStatus: "due" | "partial" | "paid" | null;
  dueAmount: number;
};

/** Real most-recent enrollment (recorded or live) per student, for course/batch filters. */
export async function fetchEnrollmentSummaryAction(studentIds: number[]) {
  if (studentIds.length === 0) return { success: true as const, data: [] as EnrollmentSummaryRow[] };
  try {
    const res = await apiRequest<EnrollmentSummaryRow[]>(
      `/admin/students/enrollment-summary?ids=${studentIds.join(",")}`,
    );
    return { success: true as const, data: res.data ?? [] };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

// The broadcast endpoints only create the job + recipient rows before
// responding (the actual sending happens in the background), but inserting
// a few hundred recipient rows can still take a bit longer than a normal
// page-load API call, so this gets a slightly longer timeout than
// apiRequest's default 15s (see api-client.ts).
const BULK_SEND_TIMEOUT_MS = 30_000;

/**
 * Kicks off a real SMS send (via BulkSMSBD) to the given students' phone
 * numbers. Returns immediately with a jobId — the actual sending happens in
 * the background; poll getBroadcastJobAction(jobId) for live progress.
 */
export async function sendSmsToStudentsAction(studentIds: number[], message: string) {
  try {
    const res = await apiRequest<{ jobId: number; total: number }>(
      "/sms-broadcast/students",
      { method: "POST", body: JSON.stringify({ studentIds, message }) },
      BULK_SEND_TIMEOUT_MS,
    );
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/**
 * Kicks off a real email send to the given students' email addresses.
 * Returns immediately with a jobId — poll getBroadcastJobAction(jobId) for
 * live progress.
 */
export async function sendEmailToStudentsAction(studentIds: number[], subject: string, message: string) {
  try {
    const res = await apiRequest<{ jobId: number; total: number }>(
      "/email-broadcast/students",
      { method: "POST", body: JSON.stringify({ studentIds, subject, message }) },
      BULK_SEND_TIMEOUT_MS,
    );
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
