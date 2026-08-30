import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { BatchSubmission } from "./batch";

export const liveBatchApiBrowser = {
  joinSession: (sessionId: number) =>
    apiRequestBrowser<{ meetingUrl: string }>(`/live-batch/sessions/${sessionId}/join`, {
      method: "POST",
    }),

  submitAssignment: (
    assignmentId: number,
    body: { submissionUrl?: string; submissionText?: string },
  ) =>
    apiRequestBrowser<BatchSubmission>(`/live-batch/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
