"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Radio, GraduationCap, Search, Filter, BookOpen } from "lucide-react";
import type { Enrollment } from "@/features/courses/api/enrollments";
import type { DashboardCtaSettings } from "@/features/cms/api/settings";
import { progressOf } from "@/lib/utils";

type StatusFilter = "all" | "not_started" | "in_progress" | "completed";

export function StudentCoursesClient({
  enrollments,
  labels,
}: {
  enrollments: Enrollment[];
  labels: DashboardCtaSettings;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "live" | "recorded">("all");

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const title = e.courseTitle.toLowerCase();
        const instructor = `${e.instructorFirstName} ${e.instructorLastName}`.toLowerCase();
        if (!title.includes(q) && !instructor.includes(q)) return false;
      }
      // Type
      if (typeFilter !== "all" && e.courseType !== typeFilter) return false;
      // Status
      if (statusFilter !== "all") {
        const p = progressOf(e);
        if (statusFilter === "not_started" && p > 0) return false;
        if (statusFilter === "in_progress" && (p === 0 || p >= 100)) return false;
        if (statusFilter === "completed" && p < 100) return false;
      }
      return true;
    });
  }, [enrollments, search, statusFilter, typeFilter]);

  const live = filtered.filter((e) => e.courseType === "live");
  const recorded = filtered.filter((e) => e.courseType === "recorded");

  return (
    <div className="space-y-5">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition-colors focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Types</option>
            <option value="recorded">Recorded</option>
            <option value="live">Live</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition-colors focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {filtered.length} of {enrollments.length} courses
      </p>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Filter className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No courses match your filters</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
            className="mt-4 text-sm font-medium text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Live Courses */}
      {live.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Courses</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{live.length}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Batch-based, instructor-led sessions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {live.map((e) => (
              <CourseCard key={`live-${e.id}`} enrollment={e} labels={labels} />
            ))}
          </div>
        </section>
      )}

      {/* Recorded Courses */}
      {recorded.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recorded Courses</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{recorded.length}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Self-paced — learn anytime, lesson by lesson</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recorded.map((e) => (
              <CourseCard key={`recorded-${e.id}`} enrollment={e} labels={labels} />
            ))}
          </div>
        </section>
      )}
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
    <div className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${
      isSuspended
        ? "border-amber-200 opacity-80 dark:border-amber-800/50"
        : isExpired
          ? "border-red-200 opacity-80 dark:border-red-800/50"
          : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
    }`}>
      {isSuspended && (
        <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-3 py-1.5 dark:border-amber-800/30 dark:bg-amber-500/10">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Access Suspended</span>
        </div>
      )}
      {isExpired && (
        <div className="flex items-center gap-1.5 border-b border-red-100 bg-red-50 px-3 py-1.5 dark:border-red-800/30 dark:bg-red-500/10">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">Access Expired</span>
        </div>
      )}

      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
        {enrollment.courseThumbnail ? (
          <Image src={enrollment.courseThumbnail} alt={enrollment.courseTitle} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className={`object-cover ${isBlocked ? "grayscale" : ""}`} />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isBlocked ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" : isLive ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-500/10 dark:to-emerald-500/10" : "bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-solid/10 dark:to-indigo-500/10"
          }`}>
            {isLive ? <Radio className={`h-8 w-8 ${isBlocked ? "text-slate-400" : "text-green-500"}`} /> : <GraduationCap className={`h-8 w-8 ${isBlocked ? "text-slate-400" : "text-brand-solid"}`} />}
          </div>
        )}
        <div className="absolute left-1.5 top-1.5">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 shadow-sm dark:bg-slate-900/90">
              <GraduationCap className="h-2.5 w-2.5" /> Recorded
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{enrollment.courseTitle}</p>
        <p className="mb-2.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{instructorName}</p>

        {!isLive && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {isSuspended ? (
          <Link href={`/learn/${enrollment.courseSlug}/suspended`} className="mt-auto block w-full rounded-lg bg-amber-100 py-2 text-center text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20">View Details</Link>
        ) : isExpired ? (
          <Link href={`/learn/${enrollment.courseSlug}/expired`} className="mt-auto block w-full rounded-lg bg-red-50 py-2 text-center text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">Access Expired</Link>
        ) : (
          <Link
            href={isLive ? `/student/live/${enrollment.courseSlug}` : `/learn/${enrollment.courseSlug}`}
            className="mt-auto block w-full rounded-lg bg-brand-solid py-2 text-center text-xs font-medium text-white transition-colors hover:bg-brand-hover"
          >
            {isLive ? labels.goToClass : progress === 0 ? labels.startLearning : progress === 100 ? labels.review : labels.continueText}
          </Link>
        )}
      </div>
    </div>
  );
}
