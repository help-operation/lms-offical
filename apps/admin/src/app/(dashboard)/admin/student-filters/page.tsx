import {
  fetchEnrollmentSummaryAction,
  fetchStudentsForFilterAction,
  type EnrollmentSummaryRow,
} from "@/features/student-filters/actions";
import { StudentFiltersClient } from "@/features/student-filters/StudentFiltersClient";
import { getSmsTemplatesAction } from "@/features/sms-templates/actions";
import { getEmailTemplatesAction } from "@/features/email-templates/actions";

export const metadata = { title: "Student Filters" };

export default async function StudentFiltersPage() {
  const [studentsRes, smsTemplatesRes, emailTemplatesRes] = await Promise.all([
    fetchStudentsForFilterAction(),
    getSmsTemplatesAction(),
    getEmailTemplatesAction(),
  ]);

  const students = studentsRes.success ? studentsRes.data : [];
  const smsTemplates = smsTemplatesRes.success ? smsTemplatesRes.data.filter((t) => t.isEnabled) : [];
  const emailTemplates = emailTemplatesRes.success ? emailTemplatesRes.data.filter((t) => t.isEnabled) : [];

  const enrollmentRes = await fetchEnrollmentSummaryAction(students.map((s) => s.id));
  const enrollmentByUserId: Record<number, EnrollmentSummaryRow> = {};
  if (enrollmentRes.success) {
    for (const row of enrollmentRes.data) enrollmentByUserId[row.userId] = row;
  }

  return (
    <StudentFiltersClient
      initial={students}
      loadError={studentsRes.success ? null : studentsRes.message}
      smsTemplates={smsTemplates}
      emailTemplates={emailTemplates}
      enrollmentByUserId={enrollmentByUserId}
    />
  );
}
