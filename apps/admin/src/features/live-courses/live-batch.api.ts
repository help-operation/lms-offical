"use server";

import { apiRequest } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminSession {
  id: number;
  liveCourseId: number;
  batchId: number;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
  recordingUrl: string | null;
  order: number;
}

export interface AdminResource {
  id: number;
  liveCourseId: number;
  batchId: number | null;
  title: string;
  fileUrl: string;
  fileType: string | null;
  order: number;
}

export interface AdminAssignment {
  id: number;
  liveCourseId: number;
  batchId: number;
  title: string;
  description: string | null;
  instructionsUrl: string | null;
  dueDate: string | null;
  maxScore: number;
}

export interface AdminSubmission {
  id: number;
  userId: number;
  submissionUrl: string | null;
  submissionText: string | null;
  status: "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string | null;
}

type R<T> = { success: boolean; data?: T; message?: string };

async function call<T>(path: string, init?: RequestInit): Promise<R<T>> {
  try {
    const res = await apiRequest<T>(path, init);
    return { success: true, data: res.data ?? undefined };
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Request failed" };
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessionsAction(batchId: number) {
  return call<AdminSession[]>(`/admin/live-batch/batches/${batchId}/sessions`);
}

export async function createSessionAction(
  batchId: number,
  data: Partial<AdminSession> & { title: string; scheduledAt: string },
) {
  return call<AdminSession>(`/admin/live-batch/batches/${batchId}/sessions`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateSessionAction(sessionId: number, data: Partial<AdminSession>) {
  return call<AdminSession>(`/admin/live-batch/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteSessionAction(sessionId: number) {
  return call<{ deleted: boolean }>(`/admin/live-batch/sessions/${sessionId}`, { method: "DELETE" });
}

// ── Resources ───────────────────────────────────────────────────────────────

export async function listResourcesAction(courseId: number) {
  return call<AdminResource[]>(`/admin/live-batch/courses/${courseId}/resources`);
}

export async function createResourceAction(
  courseId: number,
  data: { title: string; fileUrl: string; fileType?: string; batchId?: number | null },
) {
  return call<AdminResource>(`/admin/live-batch/courses/${courseId}/resources`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateResourceAction(resourceId: number, data: Partial<AdminResource>) {
  return call<AdminResource>(`/admin/live-batch/resources/${resourceId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteResourceAction(resourceId: number) {
  return call<{ deleted: boolean }>(`/admin/live-batch/resources/${resourceId}`, { method: "DELETE" });
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function listAssignmentsAction(batchId: number) {
  return call<AdminAssignment[]>(`/admin/live-batch/batches/${batchId}/assignments`);
}

export async function createAssignmentAction(
  batchId: number,
  data: { title: string; description?: string; instructionsUrl?: string; dueDate?: string; maxScore?: number },
) {
  return call<AdminAssignment>(`/admin/live-batch/batches/${batchId}/assignments`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateAssignmentAction(assignmentId: number, data: Partial<AdminAssignment>) {
  return call<AdminAssignment>(`/admin/live-batch/assignments/${assignmentId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteAssignmentAction(assignmentId: number) {
  return call<{ deleted: boolean }>(`/admin/live-batch/assignments/${assignmentId}`, { method: "DELETE" });
}

// ── Submissions ─────────────────────────────────────────────────────────────

export async function listSubmissionsAction(assignmentId: number) {
  return call<AdminSubmission[]>(`/admin/live-batch/assignments/${assignmentId}/submissions`);
}

export async function gradeSubmissionAction(submissionId: number, data: { score: number; feedback?: string }) {
  return call<AdminSubmission>(`/admin/live-batch/submissions/${submissionId}/grade`, { method: "PATCH", body: JSON.stringify(data) });
}
