import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveBatchApi } from "@/features/live-courses/api/batch";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import { LiveBatchDashboard } from "@/features/live-courses/LiveBatchDashboard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `My Class | ${slug}` };
}

// Auth is handled by the (dashboard) layout. Here we resolve the course and
// gate on enrollment, then render the batch hub inside the student portal.
export default async function StudentLiveBatchPage({ params }: Props) {
  const { slug } = await params;

  const courseRes = await liveCoursesApi.getBySlug(slug).catch(() => null);
  if (!courseRes?.data) notFound();

  // Enrollment-only — not enrolled → distinguish suspended/expired/generic.
  const status = await liveCurriculumApi
    .enrollmentStatus(courseRes.data.id)
    .catch(() => null);
  if (!status?.data?.enrolled) {
    if (status?.data?.reason === "suspended") redirect(`/student/live/${slug}/suspended`);
    if (status?.data?.reason === "expired")   redirect(`/student/live/${slug}/expired`);
    redirect("/student/courses");
  }

  const dashRes = await liveBatchApi.dashboard(courseRes.data.id).catch(() => null);
  if (!dashRes?.data) redirect("/student/courses");

  return <LiveBatchDashboard data={dashRes.data} slug={slug} />;
}
