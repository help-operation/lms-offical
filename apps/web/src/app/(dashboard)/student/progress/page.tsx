import { BookOpen, TrendingUp, CheckCircle2, Clock, Award, BarChart3 } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { certificatesApi } from "@/features/courses/api/certificates";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Progress } from "@repo/ui/progress";
import { progressOf } from "@/lib/utils";

export const metadata = { title: "My Progress" };

export default async function StudentProgressPage() {
  const user = await authApi.me().catch(() => null);
  if (!user || user.data.role !== "STUDENT") redirect("/");

  const [enrollmentsRes, certificatesRes] = await Promise.all([
    enrollmentsApi.myEnrollments().catch(() => null),
    certificatesApi.mine().catch(() => null),
  ]);

  const enrollments = enrollmentsRes?.data ?? [];
  const certificates = certificatesRes?.data ?? [];
  const withProgress = enrollments.map((e) => ({ ...e, progress: progressOf(e) }));

  const totalCourses = withProgress.length;
  const completedCourses = withProgress.filter((e) => e.progress >= 100).length;
  const inProgressCourses = withProgress.filter((e) => e.progress > 0 && e.progress < 100).length;
  const notStartedCourses = withProgress.filter((e) => e.progress === 0).length;
  const totalLessons = withProgress.reduce((sum, e) => sum + e.totalLessons, 0);
  const completedLessons = withProgress.reduce((sum, e) => sum + e.completedLessons, 0);
  const avgProgress =
    totalCourses > 0
      ? Math.round(withProgress.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;

  if (totalCourses === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-500/10">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Progress Yet</h3>
          <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
            You haven&apos;t enrolled in any courses yet. Start learning to track your progress.
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
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={<BookOpen className="h-5 w-5" />} label="Total Courses" value={String(totalCourses)} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={String(completedCourses)} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="In Progress" value={String(inProgressCourses)} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <SummaryCard icon={<BarChart3 className="h-5 w-5" />} label="Avg. Progress" value={`${avgProgress}%`} color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Lessons Done" value={`${completedLessons}/${totalLessons}`} color="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" />
        <SummaryCard icon={<Award className="h-5 w-5" />} label="Certificates" value={String(certificates.length)} color="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Overall Progress</p>
            <p className="text-4xl font-light text-slate-950 dark:text-slate-100">{avgProgress}%</p>
          </div>
          <div className="flex gap-2">
            {notStartedCourses > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notStartedCourses} not started</span>}
            {inProgressCourses > 0 && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand dark:bg-brand-500/10">{inProgressCourses} in progress</span>}
            {completedCourses > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">{completedCourses} done</span>}
          </div>
        </div>
        <Progress value={avgProgress} className="mt-4 h-3" />
      </div>

      {/* Per-course progress */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course-wise Progress</h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {withProgress
            .sort((a, b) => b.progress - a.progress)
            .map((e) => (
              <div key={`${e.courseType}-${e.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{e.courseTitle}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      e.progress >= 100 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : e.progress > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {e.completedLessons}/{e.totalLessons} lessons · {e.courseType === "live" ? "Live" : "Recorded"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:w-48">
                  <Progress value={e.progress} className="h-2 flex-1" />
                  <span className="w-10 text-right text-sm font-medium text-slate-600 dark:text-slate-300">{e.progress}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
