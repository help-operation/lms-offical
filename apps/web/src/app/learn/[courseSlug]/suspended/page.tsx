import Link from "next/link";
import { coursesApi } from "@/features/courses/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { authApi } from "@/features/auth/api";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { courseSlug } = await params;
  const res = await coursesApi.detail(courseSlug).catch(() => null);
  return { title: `Access Suspended — ${res?.data?.title ?? "Course"}` };
}

export default async function SuspendedPage({ params }: Props) {
  const { courseSlug } = await params;

  const user = await authApi.me().catch(() => null);
  if (!user) redirect(`/login?redirect=/learn/${courseSlug}`);

  const courseRes = await coursesApi.detail(courseSlug).catch(() => null);
  const courseTitle = courseRes?.data?.title ?? "this course";

  const statusRes = courseRes?.data
    ? await enrollmentsApi.enrollmentStatus(courseRes.data.id).catch(() => null)
    : null;
  const statusReason = statusRes?.data?.statusReason ?? null;

  const dashboard =
    user.data.role === "STUDENT" ? "/student/courses" : "/guest/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
          <svg
            className="h-10 w-10 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-2">Access Suspended</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          Your access to{" "}
          <span className="text-white font-medium">{courseTitle}</span> has been
          temporarily suspended by an administrator.
        </p>
        {statusReason && (
          <p className="text-amber-300 text-xs leading-relaxed mb-1 bg-amber-500/10 ring-1 ring-amber-500/20 rounded-lg px-3 py-2 mt-3">
            <span className="font-semibold">Reason:</span> {statusReason}
          </p>
        )}
        <p className="text-gray-500 text-xs leading-relaxed mb-2 mt-3">
          If you believe this is a mistake, please contact our support team and
          we will look into it as soon as possible. See our{" "}
          <Link href="/terms-conditions" className="text-amber-400 hover:text-amber-300 underline">
            Terms &amp; Conditions
          </Link>{" "}
          for more details.
        </p>
        <div className="mb-6" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-6 py-2.5 transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href={dashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium px-6 py-2.5 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
