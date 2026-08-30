"use client";

import { ChevronRight, Star } from "lucide-react";

export function ElevateHero({
  course,
}: {
  course: {
    title: string;
    categoryName?: string | null;
    description?: string | null;
    rating?: number | null;
  };
}) {
  const rating = course.rating ?? 4.8;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white transition-colors duration-300 dark:from-brand-800 dark:to-gray-950">
      {/* Decorative dot grid */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
        <pattern id="admin-course-hero-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#admin-course-hero-dots)" />
      </svg>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-black/10 blur-2xl" />

      <div className="container relative z-10 mx-auto px-4 pb-14 pt-10">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs font-medium text-brand-100/80">
          <span className="hover:text-white cursor-default">Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-white cursor-default">Courses</span>
          {course.categoryName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70">{course.categoryName}</span>
            </>
          )}
        </nav>

        <div className="lg:w-2/3">
          {course.categoryName && (
            <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {course.categoryName}
            </span>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {course.title || "Course Title"}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-white/30"}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-white">{rating.toFixed(1)}</span>
            </div>
            <span className="text-brand-100/80">
              91% of students rated this course 5&#9733;
            </span>
          </div>

          {course.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-brand-50/85 line-clamp-3">
              {course.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
