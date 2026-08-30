import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

export function ElevateCourseHero({
  title,
  categoryName,
  description,
  rating,
  ratingPct,
  textOverrides,
}: {
  title: string;
  categoryName: string | null;
  description: string | null;
  rating: number | null;
  ratingPct: number;
  textOverrides?: Record<string, string>;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white transition-colors duration-300 dark:from-brand-800 dark:to-gray-950">
      {/* Decorative dot grid */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
        <pattern id="course-hero-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#course-hero-dots)" />
      </svg>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-black/10 blur-2xl" />

      <div className="container relative z-10 mx-auto px-4 pb-14 pt-10">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs font-medium text-brand-100/80">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/courses" className="hover:text-white">Courses</Link>
          {categoryName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70">{categoryName}</span>
            </>
          )}
        </nav>

        <div className="lg:w-2/3">
          {categoryName && (
            <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {categoryName}
            </span>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${s <= Math.round(rating ?? 5) ? "fill-amber-400 text-amber-400" : "text-white/30"}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-white">{(rating ?? 5).toFixed(1)}</span>
            </div>
            <span className="text-brand-100/80">
              {ratingPct}% of students rated this course 5★
            </span>
          </div>

          {description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-brand-50/85 line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
