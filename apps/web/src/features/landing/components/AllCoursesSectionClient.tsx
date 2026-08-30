"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";
import type { MixedCourse } from "@/features/landing/api/landing.api";
import type { AllCoursesContent } from "./AllCoursesSection";
import { MixedCourseCard } from "./MixedCourseCard";

type FilterKey = "all" | "live" | "recorded" | "free" | "paid";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "live",     label: "Live"     },
  { key: "recorded", label: "Recorded" },
  { key: "free",     label: "Free"     },
  { key: "paid",     label: "Paid"     },
];

function applyFilter(courses: MixedCourse[], filter: FilterKey): MixedCourse[] {
  switch (filter) {
    case "live":     return courses.filter((c) => c.type === "live");
    case "recorded": return courses.filter((c) => c.type === "recorded");
    case "free":     return courses.filter((c) => parseFloat(c.price) === 0);
    case "paid":     return courses.filter((c) => parseFloat(c.price) > 0);
    default:         return courses;
  }
}

type Props = {
  courses: MixedCourse[];
  d: Required<AllCoursesContent>;
};

export default function AllCoursesSectionClient({ courses, d }: Props) {
  const [active, setActive] = useState<FilterKey>("all");

  const filtered = applyFilter(courses, active);

  const visibleFilters = FILTERS.filter(({ key }) => {
    if (key === "all") return true;
    return applyFilter(courses, key).length > 0;
  });

  return (
    <>
      {/* Heading row */}
      <div className="flex items-end justify-between">
        <h2 className="text-3xl md:text-[48px] font-bold leading-tight text-gray-900 dark:text-gray-100">
          {d.title_prefix && <>{d.title_prefix}{" "}</>}
          <span className="relative text-accent">
            {d.title_highlight}
            <span className="absolute -bottom-2 left-0 h-[6px] w-full rounded-full bg-accent/40" />
          </span>
          {d.title_suffix && <>{" "}{d.title_suffix}</>}
        </h2>
        <Link
          href={d.see_all_link}
          className="hidden sm:flex items-center gap-2 text-lg font-bold text-brand-600 dark:text-brand-400 hover:gap-3 transition-all"
        >
          {d.see_all_label} <ArrowUpRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
        {visibleFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={[
              "min-w-[80px] cursor-pointer rounded-md px-5 py-2 text-sm font-bold shadow-md transition-all duration-200 hover:scale-105",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              active === key
                ? "bg-gradient-to-r from-brand-from to-brand-to text-white"
                : "border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-brand-600 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-400",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {filtered.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((c) => (
            <MixedCourseCard key={`${c.type}-${c.id}`} c={c} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
          <BookOpen className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-base font-medium">No courses found for this filter.</p>
        </div>
      )}

      {/* Mobile "see all" */}
      <div className="mt-8 flex justify-center sm:hidden">
        <Link href={d.see_all_link} className="flex items-center gap-2 text-base font-bold text-brand-600 dark:text-brand-400">
          {d.see_all_label} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
