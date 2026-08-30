"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { BookOpen } from "lucide-react";

export type CoursesGridContent = {
  eyebrow?: string;
  title?: string;
  filters?: string[];
  see_all_label?: string;
  see_all_link?: string;
  limit?: number;
};

/** Minimal shape the shared grid needs — the consuming app supplies richer markup via `cards`. */
export type CourseGridItem = {
  id: string | number;
  slug?: string;
  title: string;
  thumbnail?: string | null;
  categoryName?: string | null;
};

type Props = {
  content?: CoursesGridContent;
  courses: CourseGridItem[];
  /**
   * Pre-rendered card markup keyed by course id, built server-side by the
   * consuming app (e.g. with the richer `CourseCard`). A function can't cross
   * the server/client boundary since this component is interactive
   * (`"use client"`), so the caller renders the JSX and hands it over instead.
   */
  cards?: Record<string, ReactNode>;
  /** Hide the category filter tab row and always show every course. Defaults to true. */
  showFilters?: boolean;
};

const DEFAULTS: Required<CoursesGridContent> = {
  eyebrow: "Our Best Courses",
  title: "Best Selling Courses",
  filters: ["All Courses", "UI/UX Design", "Software Development", "Web Development", "Digital Marketing"],
  see_all_label: "See all",
  see_all_link: "/courses",
  limit: 8,
};

const ALL_COURSES_LABEL = "All Courses";

/** Fallback card used when the consuming app doesn't supply `renderCard` (e.g. the admin preview). */
function DefaultCourseCard({ course }: { course: CourseGridItem }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="relative h-[190px] w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-800 dark:to-gray-700">
            <BookOpen className="h-12 w-12 text-brand-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">{course.title}</h3>
      </div>
    </div>
  );
}

export function CoursesGridV2({ content = {}, courses, cards, showFilters = true }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<CoursesGridContent>;
  const [activeFilter, setActiveFilter] = useState(d.filters[0] ?? ALL_COURSES_LABEL);

  if (courses.length === 0) return null;

  const filtered =
    !showFilters || activeFilter === ALL_COURSES_LABEL
      ? courses
      : courses.filter((c) => (c.categoryName ?? "").toLowerCase() === activeFilter.toLowerCase());
  const shown = filtered.slice(0, d.limit);

  return (
    <section className="bg-white py-16 transition-colors duration-300 dark:bg-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
        </div>

        {/* Filter row — filters the grid below by category (client-side, from the fetched pool) */}
        {showFilters && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {d.filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  f === activeFilter ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">No courses found in this category yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((course) => (
              <div key={course.id}>{cards?.[String(course.id)] ?? <DefaultCourseCard course={course} />}</div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href={d.see_all_link}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {d.see_all_label}
          </a>
        </div>
      </div>
    </section>
  );
}

export default CoursesGridV2;
