import { FileCheck, BookOpen, ExternalLink } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
  const user = await authApi.me().catch(() => null);
  if (!user || user.data.role !== "STUDENT") redirect("/");

  const enrollmentsRes = await enrollmentsApi.myEnrollments().catch(() => null);
  const enrollments = enrollmentsRes?.data ?? [];
  const activeEnrollments = enrollments.filter((e) => e.status !== "suspended" && e.status !== "expired");

  if (activeEnrollments.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-500/10">
            <FileCheck className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Assignments Yet</h3>
          <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
            Enroll in a course to get assignments from your instructors.
          </p>
          <Link href="/courses" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
            <BookOpen className="h-4 w-4" /> Explore Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-500/5">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Assignments are available within each course. Click on a course below to access its lessons and assignments.
        </p>
      </div>

      {/* Courses with assignments access */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your Courses</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Access assignments from your enrolled courses</p>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {activeEnrollments.map((e) => {
            const progress = e.totalLessons > 0 ? Math.round((e.completedLessons / e.totalLessons) * 100) : 0;
            const href = e.courseType === "live" ? `/student/live/${e.courseSlug}` : `/learn/${e.courseSlug}`;
            return (
              <Link
                key={`${e.courseType}-${e.id}`}
                href={href}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  e.courseType === "live" ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                }`}>
                  <FileCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{e.courseTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {e.courseType === "live" ? "Live Course" : `${e.completedLessons}/${e.totalLessons} lessons · ${progress}% complete`}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
