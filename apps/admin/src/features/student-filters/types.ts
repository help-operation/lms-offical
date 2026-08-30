import type { Student } from "@/features/students/types";

export type PaymentStatus = "paid" | "partial" | "due";
export type ActiveStatus = "active" | "inactive";
export type CourseType = "live" | "recorded" | "none";
export type EnrollmentStatus = "active" | "completed" | "suspended" | "refunded" | "none";

/**
 * A real student (from GET /admin/students), enriched with data from
 * GET /admin/students/enrollment-summary: course/batch/enrollment status
 * (most recent enrollment across recorded + live courses), plus real
 * payment status/due amount (SQL-computed across all enrollments) and
 * last login (users.lastLoginAt). See `enrichment.ts`.
 */
export type EnrichedStudent = Student & {
  courseType: CourseType;
  courseName: string;
  batchName: string | null;
  hasRealEnrollment: boolean;
  paymentStatus: PaymentStatus;
  dueAmount: number;
  activeStatus: ActiveStatus;
  enrollmentStatus: EnrollmentStatus;
  lastLoginAt: string | null;
};

export type Filters = {
  search: string;
  courseName: string; // "" = all
  batchName: string; // "" = all
  courseType: CourseType | "";
  paymentStatus: PaymentStatus | "";
  activeStatus: ActiveStatus | "";
  enrollmentStatus: EnrollmentStatus | "";
  registeredFrom: string;
  registeredTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
};

export const EMPTY_FILTERS: Filters = {
  search: "",
  courseName: "",
  batchName: "",
  courseType: "",
  paymentStatus: "",
  activeStatus: "",
  enrollmentStatus: "",
  registeredFrom: "",
  registeredTo: "",
  lastLoginFrom: "",
  lastLoginTo: "",
};
