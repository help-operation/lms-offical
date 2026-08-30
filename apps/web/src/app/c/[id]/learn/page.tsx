import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Entry point for a live course's content (keyed by course id): gate on login +
 * enrollment, then redirect into the first lesson. No lessons yet → student
 * courses list.
 */
export default async function LiveLearnEntryPage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);

  const user = await authApi.me().catch(() => null);
  if (!user) redirect(`/login?redirect=/c/${id}/learn`);

  const courseRes = await liveCoursesApi.getById(courseId).catch(() => null);
  if (!courseRes?.data) redirect("/courses");

  const status = await liveCurriculumApi.enrollmentStatus(courseId).catch(() => null);
  if (!status?.data?.enrolled) redirect(`/${courseRes.data.slug}`);

  const curriculumRes = await liveCurriculumApi.curriculum(courseId).catch(() => null);
  const firstLesson = curriculumRes?.data?.flatMap((m) => m.lessons)[0];

  if (!firstLesson) redirect("/student/courses");

  redirect(`/c/${id}/learn/${firstLesson.id}`);
}
