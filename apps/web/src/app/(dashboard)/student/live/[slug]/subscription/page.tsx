import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";
import StudentSubscriptionDashboard from "@/features/live-courses/StudentSubscriptionDashboard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Subscription | ${slug}` };
}

export default async function StudentSubscriptionPage({ params }: Props) {
  const { slug } = await params;

  const courseRes = await liveCoursesApi.getBySlug(slug).catch(() => null);
  if (!courseRes?.data) notFound();

  // Verify enrollment
  const status = await liveCurriculumApi
    .enrollmentStatus(courseRes.data.id)
    .catch(() => null);
  if (!status?.data?.enrolled) {
    redirect("/student/courses");
  }

  return (
    <div className="py-6">
      <StudentSubscriptionDashboard
        courseSlug={slug}
        courseId={courseRes.data.id}
      />
    </div>
  );
}
