import { apiRequest } from "@/lib/api-client";

export interface BatchSession {
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
  attended: boolean;
}

export interface BatchResource {
  id: number;
  liveCourseId: number;
  batchId: number | null;
  title: string;
  fileUrl: string;
  fileType: string | null;
  order: number;
}

export interface BatchSubmission {
  id: number;
  assignmentId: number;
  userId: number;
  submissionUrl: string | null;
  submissionText: string | null;
  status: "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface BatchAssignment {
  id: number;
  liveCourseId: number;
  batchId: number;
  title: string;
  description: string | null;
  instructionsUrl: string | null;
  dueDate: string | null;
  maxScore: number;
  mySubmission: BatchSubmission | null;
}

export interface BatchInfo {
  id: number;
  batchName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  supportSchedule: string | null;
  maxSeats: number | null;
  seatsFilled: number;
  notes: string | null;
}

export interface BatchDashboard {
  enrollment: { id: number; status: string; paidAt: string | null; amount: string; batchId: number | null };
  course: {
    id: number;
    title: string;
    slug: string;
    instructors: Array<{ name: string; title?: string; image?: string; bio?: string }>;
    certificate: { title?: string; description?: string; image?: string };
    supportWhatsapp: string | null;
    hasContent: boolean;
  };
  batch: BatchInfo | null;
  sessions: BatchSession[];
  resources: BatchResource[];
  assignments: BatchAssignment[];
  attendanceCount: number;
}

export const liveBatchApi = {
  dashboard: (courseId: number) =>
    apiRequest<BatchDashboard>(`/live-batch/courses/${courseId}/dashboard`),
};
