import type { Student } from "@/features/students/types";
import type { EnrollmentSummaryRow } from "./actions";
import type { ActiveStatus, EnrichedStudent } from "./types";

export function enrichStudent(student: Student, enrollment: EnrollmentSummaryRow | undefined): EnrichedStudent {
  const activeStatus: ActiveStatus = student.status === "active" ? "active" : "inactive";

  return {
    ...student,
    courseType: enrollment?.courseType ?? "none",
    courseName: enrollment?.courseName ?? "No enrollment",
    batchName: enrollment?.batchName ?? null,
    hasRealEnrollment: !!enrollment,
    enrollmentStatus: (enrollment?.enrollmentStatus as EnrichedStudent["enrollmentStatus"]) ?? "none",
    paymentStatus: enrollment?.paymentStatus ?? "due",
    dueAmount: enrollment?.dueAmount ?? 0,
    activeStatus,
    lastLoginAt: enrollment?.lastLoginAt ?? null,
  };
}
