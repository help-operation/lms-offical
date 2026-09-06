import Link from "next/link";
import { Radio, GraduationCap, BookOpen, BarChart3 } from "lucide-react";
import { enrollmentsApi, type Enrollment } from "@/features/courses/api/enrollments";
import {
  getPublicDashboardCtaSettings,
  type DashboardCtaSettings,
} from "@/features/cms/api/settings";
import { StudentCoursesClient } from "@/features/courses/StudentCoursesClient";
import { progressOf } from "@/lib/utils";

export const metadata = { title: "My Courses" };

export default async function StudentCoursesPage() {
  const [res, ctaLabels] = await Promise.all([
    enrollmentsApi.myEnrollments().catch(() => null),
    getPublicDashboardCtaSettings(),
  ]);
  const enrollments = res?.data ?? [];

  const live = enrollments.filter((e) => e.courseType === "live");
  const recorded = enrollments.filter((e) => e.courseType === "recorded");

  const avgProgress =
    recorded.length > 0
      ? Math.round(recorded.reduce((s, e) => s + progressOf(e), 0) / recorded.length)
      : 0;

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="mb-1 text-lg font-semibold text-slate-700 dark:text-slate-200">No courses yet</h3>
        <p className="mb-5 text-sm text-slate-400 dark:text-slate-500">Browse courses and start learning today</p>
        <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl bg-brand-solid px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Explore Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Total Courses" value={enrollments.length} accent="text-brand-solid bg-brand-50 dark:bg-brand-solid/10" />
        <StatCard icon={<Radio className="h-5 w-5" />} label="Live Courses" value={live.length} accent="text-green-600 bg-green-50 dark:bg-green-500/10" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Recorded Courses" value={recorded.length} accent="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Avg. Progress" value={`${avgProgress}%`} accent="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
      </div>

      {/* Search + Filter + Course Grid */}
      <StudentCoursesClient enrollments={enrollments} labels={ctaLabels} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
