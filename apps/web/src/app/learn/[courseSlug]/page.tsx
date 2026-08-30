import { redirect } from "next/navigation";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { authApi } from "@/features/auth/api";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export default async function LearnCoursePage({ params }: Props) {
  const { courseSlug } = await params;

  const user = await authApi.me().catch(() => null);
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}`);

  const dashboard =
    user.data.role === "STUDENT" ? "/student/dashboard" : "/guest/dashboard";

  const courseRes = await coursesApi.detail(courseSlug).catch(() => null);
  if (!courseRes?.data) redirect("/courses");

  // Enrollment-only — not enrolled → role-based dashboard.
  const status = await enrollmentsApi
    .enrollmentStatus(courseRes.data.id)
    .catch(() => null);
  if (!status?.data?.enrolled) {
    if (status?.data?.reason === 'suspended') redirect(`/learn/${courseSlug}/suspended`);
    if (status?.data?.reason === 'expired')   redirect(`/learn/${courseSlug}/expired`);
    redirect(dashboard);
  }

  const curriculumRes = await enrollmentsApi
    .curriculum(courseRes.data.id)
    .catch(() => null);

  if (!curriculumRes?.data) redirect(dashboard);

  const firstLesson = curriculumRes.data[0]?.lessons[0];
  if (!firstLesson) redirect(dashboard);

  redirect(`/learn/${courseSlug}/${firstLesson.id}`);
}
