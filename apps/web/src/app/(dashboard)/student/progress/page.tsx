import { BookOpen, TrendingUp, CheckCircle2, Clock, Award, BarChart3, PlayCircle } from "lucide-react";
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
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Summary cards — compact */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <SummaryCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Total"
          value={String(totalCourses)}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          cardBg="bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900"
          border="border-blue-100 dark:border-blue-500/20"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={String(completedCourses)}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          cardBg="bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900"
          border="border-emerald-100 dark:border-emerald-500/20"
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="In Progress"
          value={String(inProgressCourses)}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          cardBg="bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900"
          border="border-amber-100 dark:border-amber-500/20"
        />
        <SummaryCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg Progress"
          value={`${avgProgress}%`}
          iconBg="bg-gradient-to-br from-violet-500 to-violet-600"
          cardBg="bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-500/10 dark:to-slate-900"
          border="border-violet-100 dark:border-violet-500/20"
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Lessons"
          value={totalLessons > 0 ? `${completedLessons}/${totalLessons}` : "0"}
          iconBg="bg-gradient-to-br from-cyan-500 to-cyan-600"
          cardBg="bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-500/10 dark:to-slate-900"
          border="border-cyan-100 dark:border-cyan-500/20"
        />
        <SummaryCard
          icon={<Award className="h-4 w-4" />}
          label="Certificates"
          value={String(certificates.length)}
          iconBg="bg-gradient-to-br from-rose-500 to-rose-600"
          cardBg="bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-500/10 dark:to-slate-900"
          border="border-rose-100 dark:border-rose-500/20"
        />
      </div>

      {/* Overall progress — compact */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Overall Progress</p>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{avgProgress}%</span>
          </div>
          <div className="flex gap-1.5">
            {notStartedCourses > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {notStartedCourses} not started
              </span>
            )}
            {inProgressCourses > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-medium text-brand dark:bg-brand-500/10">
                {inProgressCourses} in progress
              </span>
            )}
            {completedCourses > 0 && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                {completedCourses} done
              </span>
            )}
          </div>
        </div>
        <Progress value={avgProgress} className="mt-3 h-2" />
      </div>

      {/* Per-course progress */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course-wise Progress</h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {withProgress
            .sort((a, b) => b.progress - a.progress)
            .map((e) => (
              <div key={`${e.courseType}-${e.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{e.courseTitle}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      e.progress >= 100
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : e.progress > 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {e.totalLessons > 0
                      ? `${e.completedLessons}/${e.totalLessons} lessons`
                      : "No lessons yet"}
                    {" · "}
                    {e.courseType === "live" ? "Live" : "Recorded"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:w-44">
                  <Progress value={e.progress} className="h-1.5 flex-1" />
                  <span className="w-9 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">{e.progress}%</span>
                </div>
                {e.progress === 0 && (
                  <Link
                    href={e.courseType === "live" ? `/${e.courseSlug}` : `/learn/${e.courseSlug}`}
                    className="hidden shrink-0 items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-brand hover:text-brand sm:inline-flex dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
                  >
                    <PlayCircle className="h-3 w-3" /> Start
                  </Link>
                )}
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
  iconBg,
  cardBg,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  cardBg: string;
  border: string;
}) {
  return (
    <div className={`group rounded-xl ${cardBg} ${border} border p-2.5 shadow-sm transition-all duration-200 hover:shadow-md dark:hover:shadow-slate-800/50`}>
      <div className={`mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
        <span className="text-white">{icon}</span>
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
