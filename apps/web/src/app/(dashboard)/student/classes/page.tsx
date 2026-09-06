import { CalendarDays, Clock, Video, ExternalLink, Radio } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { liveClassesApi } from "@/features/live-classes/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Classes & Schedule" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusInfo(s: string) {
  switch (s) {
    case "live":
      return { label: "Live Now", color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" };
    case "completed":
      return { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" };
    default:
      return { label: "Upcoming", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" };
  }
}

export default async function StudentClassesPage() {
  const user = await authApi.me().catch(() => null);
  if (!user || user.data.role !== "STUDENT") redirect("/");

  const [classesRes, enrollmentsRes] = await Promise.all([
    liveClassesApi.upcoming().catch(() => null),
    enrollmentsApi.myEnrollments().catch(() => null),
  ]);

  const classes = classesRes?.data ?? [];
  const enrollments = enrollmentsRes?.data ?? [];
  const liveEnrollments = enrollments.filter((e) => e.courseType === "live");

  if (classes.length === 0 && liveEnrollments.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-500/10">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Classes Yet</h3>
          <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
            You haven&apos;t enrolled in any live courses. Enroll in a live course to see your class schedule.
          </p>
          <Link href="/courses" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
            <Video className="h-4 w-4" /> Browse Live Courses
          </Link>
        </div>
      </div>
    );
  }

  const upcoming = classes.filter((c) => c.status === "scheduled");
  const liveNow = classes.filter((c) => c.status === "live");
  const completed = classes.filter((c) => c.status === "completed");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Enrolled live courses summary */}
      {liveEnrollments.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your Live Courses</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveEnrollments.map((e) => (
              <Link
                key={e.id}
                href={`/student/live/${e.courseSlug}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <Radio className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{e.courseTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{e.instructorFirstName} {e.instructorLastName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Live Now */}
      {liveNow.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live Now
          </h3>
          <div className="space-y-3">
            {liveNow.map((cls) => {
              const st = statusInfo(cls.status);
              return (
                <div key={cls.id} className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center dark:border-red-800/30 dark:bg-red-500/5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cls.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cls.instructorFirstName} {cls.instructorLastName} · {fmtDate(cls.scheduledAt)} · {fmtTime(cls.scheduledAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming Classes</h3>
          <div className="space-y-3">
            {upcoming.map((cls) => {
              const st = statusInfo(cls.status);
              return (
                <div key={cls.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-500/10">
                      <span className="text-[10px] font-bold uppercase">{new Date(cls.scheduledAt).toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(cls.scheduledAt).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{cls.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cls.instructorFirstName} {cls.instructorLastName} · {fmtTime(cls.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    {cls.description && (
                      <p className="hidden text-xs text-slate-400 dark:text-slate-500 lg:block max-w-[200px] truncate">{cls.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Past Classes</h3>
          <div className="space-y-2">
            {completed.slice(0, 10).map((cls) => {
              const st = statusInfo(cls.status);
              return (
                <div key={cls.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 opacity-70 dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{cls.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{fmtDate(cls.scheduledAt)} · {fmtTime(cls.scheduledAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {classes.length === 0 && liveEnrollments.length > 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No scheduled classes yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Your instructor will schedule classes soon</p>
        </div>
      )}
    </div>
  );
}
