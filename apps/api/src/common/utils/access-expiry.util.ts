/**
 * Computes a new enrollment's expiresAt from a course's access-control
 * settings. Lifetime access (or a missing/invalid duration) → no expiry.
 * Applies only to NEW enrollments — existing rows are never backfilled.
 */
export function computeEnrollmentExpiry(course: {
  hasLifetimeAccess: boolean;
  accessDurationDays: number | null;
}): Date | null {
  if (course.hasLifetimeAccess) return null;
  if (!course.accessDurationDays || course.accessDurationDays <= 0) return null;
  return new Date(Date.now() + course.accessDurationDays * 24 * 60 * 60 * 1000);
}
