import Link from "next/link";
import { liveCoursesApi } from "@/features/live-courses/api";
import { liveCurriculumApi } from "@/features/live-courses/api/curriculum";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const res = await liveCoursesApi.getBySlug(slug).catch(() => null);
  return { title: `Access Expired — ${res?.data?.title ?? "Course"}` };
}

export default async function LiveExpiredPage({ params }: Props) {
  const { slug } = await params;

  const courseRes = await liveCoursesApi.getBySlug(slug).catch(() => null);
  const courseTitle = courseRes?.data?.title ?? "this course";

  const statusRes = courseRes?.data
    ? await liveCurriculumApi.enrollmentStatus(courseRes.data.id).catch(() => null)
    : null;
  const expiredAt = statusRes?.data?.expiresAt
    ? new Date(statusRes.data.expiresAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-2">Access Expired</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          Your access period for{" "}
          <span className="text-white font-medium">{courseTitle}</span> has ended
          {expiredAt && <> as of <span className="text-white">{expiredAt}</span></>}.
        </p>
        <p className="text-gray-500 text-xs leading-relaxed mb-8">
          To regain access, please contact us or purchase a new enrollment. See our{" "}
          <Link href="/terms-conditions" className="text-brand-solid hover:underline">
            Terms &amp; Conditions
          </Link>{" "}
          for more details.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/${slug}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 transition-colors"
          >
            View Course
          </Link>
          <Link
            href="/student/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium px-6 py-2.5 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
