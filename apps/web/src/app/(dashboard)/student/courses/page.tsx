import Image from "next/image";
import Link from "next/link";
import { Radio, GraduationCap, BookOpen, BarChart3 } from "lucide-react";
import { enrollmentsApi, type Enrollment } from "@/features/courses/api/enrollments";
import {
  getPublicDashboardCtaSettings,
  type DashboardCtaSettings,
} from "@/features/cms/api/settings";

export const metadata = { title: "My Courses" };

function progressOf(e: Enrollment) {
  return e.totalLessons > 0
    ? Math.round((e.completedLessons / e.totalLessons) * 100)
    : 0;
}

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

  return (
    <div className="space-y-8">
      {enrollments.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Summary strip ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Total Courses"
              value={enrollments.length}
              accent="text-brand-solid bg-brand-50 dark:bg-brand-solid/10"
            />
            <StatCard
              icon={<Radio className="h-5 w-5" />}
              label="Live Courses"
              value={live.length}
              accent="text-green-600 bg-green-50 dark:bg-green-500/10"
            />
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              label="Recorded Courses"
              value={recorded.length}
              accent="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Avg. Progress"
              value={`${avgProgress}%`}
              accent="text-amber-600 bg-amber-50 dark:bg-amber-500/10"
            />
          </div>

          {/* ── Live Courses ──────────────────────────────────────────── */}
          {live.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                icon={<Radio className="h-5 w-5" />}
                title="Live Courses"
                subtitle="Batch-based, instructor-led sessions"
                count={live.length}
                accent="text-green-600 bg-green-50 dark:bg-green-500/10"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {live.map((e) => (
                  <CourseCard key={`live-${e.id}`} enrollment={e} labels={ctaLabels} />
                ))}
              </div>
            </section>
          )}

          {/* ── Recorded Courses ──────────────────────────────────────── */}
          {recorded.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                icon={<GraduationCap className="h-5 w-5" />}
                title="Recorded Courses"
                subtitle="Self-paced — learn anytime, lesson by lesson"
                count={recorded.length}
                accent="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recorded.map((e) => (
                  <CourseCard key={`recorded-${e.id}`} enrollment={e} labels={ctaLabels} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {count}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function CourseCard({
  enrollment,
  labels,
}: {
  enrollment: Enrollment;
  labels: DashboardCtaSettings;
}) {
  const isLive = enrollment.courseType === "live";
  const isSuspended = enrollment.status === "suspended";
  const isExpired = enrollment.status === "expired";
  const isBlocked = isSuspended || isExpired;
  const progress = progressOf(enrollment);
  const instructorName = isLive
    ? "Live Course"
    : `${enrollment.instructorFirstName} ${enrollment.instructorLastName}`.trim();

  return (
    <div className={`group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm transition-all ${
      isSuspended
        ? "border-amber-200 dark:border-amber-800/50 opacity-80"
        : isExpired
          ? "border-red-200 dark:border-red-800/50 opacity-80"
          : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5"
    }`}>
      {/* Suspended banner */}
      {isSuspended && (
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-800/30 px-3 py-1.5">
          <svg className="h-3 w-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Access Suspended
          </span>
        </div>
      )}

      {/* Expired banner */}
      {isExpired && (
        <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-800/30 px-3 py-1.5">
          <svg className="h-3 w-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
            Access Expired
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
        {enrollment.courseThumbnail ? (
          <Image
            src={enrollment.courseThumbnail}
            alt={enrollment.courseTitle}
            fill
            className={`object-cover ${isBlocked ? "grayscale" : ""}`}
          />
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              isBlocked
                ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700"
                : isLive
                  ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-500/10 dark:to-emerald-500/10"
                  : "bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-solid/10 dark:to-indigo-500/10"
            }`}
          >
            {isLive ? (
              <Radio className={`h-8 w-8 ${isBlocked ? "text-slate-400" : "text-green-500"}`} />
            ) : (
              <GraduationCap className={`h-8 w-8 ${isBlocked ? "text-slate-400" : "text-brand-solid"}`} />
            )}
          </div>
        )}

        {/* Type badge (top-left) */}
        <div className="absolute top-1.5 left-1.5">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 shadow-sm">
              <GraduationCap className="h-2.5 w-2.5" />
              Recorded
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-0.5 leading-snug">
          {enrollment.courseTitle}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5 truncate">{instructorName}</p>

        {isLive ? (
          <div className="mb-3">
            {enrollment.paymentMode === 'subscription' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  সাবস্ক্রিপশন
                  {enrollment.subscriptionStatus && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                      enrollment.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' :
                      enrollment.subscriptionStatus === 'past_due' ? 'bg-amber-100 text-amber-700' :
                      enrollment.subscriptionStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {enrollment.subscriptionStatus === 'active' ? 'Active' :
                       enrollment.subscriptionStatus === 'past_due' ? 'Pending' :
                       enrollment.subscriptionStatus === 'cancelled' ? 'Cancelled' :
                       enrollment.subscriptionStatus}
                    </span>
                  )}
                </div>
                {enrollment.subscriptionNextBillingAt && enrollment.subscriptionStatus === 'active' && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Next billing: {new Date(enrollment.subscriptionNextBillingAt).toLocaleDateString('en-BD')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Batch-based learning
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>
                {enrollment.completedLessons}/{enrollment.totalLessons} lessons
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-solid rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isSuspended ? (
          <Link
            href={`/learn/${enrollment.courseSlug}/suspended`}
            className="mt-auto block w-full text-center bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-amber-200 dark:hover:bg-amber-500/20"
          >
            View Details
          </Link>
        ) : isExpired ? (
          <Link
            href={`/learn/${enrollment.courseSlug}/expired`}
            className="mt-auto block w-full text-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            Access Expired
          </Link>
        ) : isLive && enrollment.paymentMode === 'subscription' ? (
          <div className="mt-auto flex gap-2">
            <Link
              href={`/student/live/${enrollment.courseSlug}`}
              className="flex-1 block w-full text-center bg-brand-solid hover:bg-brand-hover text-white text-xs font-medium py-2 rounded-lg transition-colors"
            >
              {labels.goToClass}
            </Link>
            <Link
              href={`/student/live/${enrollment.courseSlug}/subscription`}
              className="px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
              title="Manage Subscription"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </Link>
          </div>
        ) : (
          <Link
            href={isLive ? `/student/live/${enrollment.courseSlug}` : `/learn/${enrollment.courseSlug}`}
            className="mt-auto block w-full text-center bg-brand-solid hover:bg-brand-hover text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            {isLive
              ? labels.goToClass
              : progress === 0
                ? labels.startLearning
                : progress === 100
                  ? labels.review
                  : labels.continueText}
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="text-4xl mb-3">📚</div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">No courses yet</h3>
      <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">
        Browse courses and start learning today
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 bg-brand-solid hover:bg-brand-hover text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        Explore Courses
      </Link>
    </div>
  );
}
