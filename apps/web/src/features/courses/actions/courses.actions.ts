"use server";

import { apiRequest } from "@/lib/api-client";

/**
 * Silent — records that a logged-in user visited a course detail page for a
 * course they don't yet own. Upserted per (user, course); repeat visits just
 * refresh the seenAt timestamp. Always returns void; errors are swallowed.
 */
export async function trackCourseInterestAction(courseId: number): Promise<void> {
  try {
    await apiRequest(`/courses/${courseId}/interest`, { method: "POST" });
  } catch { /* intentionally swallowed */ }
}

export async function trackLiveCourseInterestAction(liveCourseId: number): Promise<void> {
  try {
    await apiRequest(`/live-courses/${liveCourseId}/interest`, { method: "POST" });
  } catch { /* intentionally swallowed */ }
}
