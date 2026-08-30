import Link from "next/link";
import { BookOpen, Star, Users } from "lucide-react";
import type { PublicLiveCourseCard } from "@/features/live-courses/api";
import { AnimatedAvailability } from "@/features/live-courses/AnimatedAvailability";
import { LiveBadge } from "@/features/live-courses/LiveBadge";

interface LiveCourseCardProps {
  course: PublicLiveCourseCard;
  /** True when the logged-in user already owns this live course. */
  enrolled?: boolean;
}

export function LiveCourseCard({ course, enrolled = false }: LiveCourseCardProps) {
  const price    = parseFloat(course.price);
  const origPrice = course.originalPrice ? parseFloat(course.originalPrice) : null;

  // Admin-set marketing rating (live courses have no review system). Empty when unset.
  const rating = course.hero?.rating ?? 0;
  const filledStars = Math.round(rating);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">

      {/* Thumbnail */}
      <Link href={`/${course.slug}`} className="relative block h-[190px] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {course.hero?.bannerImage ? (
          <img
            src={course.hero.bannerImage}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-800 dark:to-gray-700">
            <BookOpen className="h-12 w-12 text-red-300" />
          </div>
        )}
        {/* Live badge — conditionally shown */}
        {course.showBadge && (
          <div className="absolute left-3 top-3">
            <LiveBadge />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {course.totalLiveClasses && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              {course.totalLiveClasses} Classes
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/${course.slug}`}
          className="mt-3 line-clamp-2 min-h-[48px] text-[15px] font-bold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
        >
          {course.title}
        </Link>

        {/* Availability — alternates "Limited seats available" / "Register now" */}
        <div className="mt-3 flex items-center justify-between">
          <AnimatedAvailability />
        </div>

        {/* Rating row — admin-set marketing rating, empty stars when unset */}
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < filledStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({rating ? rating.toFixed(1) : 0})
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Users className="h-3.5 w-3.5" />
            Live Batch
          </span>
        </div>

        {/* Price + CTA — or "Enrolled" state when the user already owns it */}
        <div className="mt-4 flex items-center justify-between">
          {enrolled ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                ✓ Enrolled
              </span>
              <Link
                href="/student/courses"
                className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
              >
                Continue
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {price === 0 ? "Free" : `৳ ${price.toLocaleString()}`}
                </span>
                {origPrice && origPrice > price && (
                  <span className="text-sm text-gray-400 line-through dark:text-gray-500">
                    ৳ {origPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <Link
                href={`/${course.slug}`}
                className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
              >
                Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
