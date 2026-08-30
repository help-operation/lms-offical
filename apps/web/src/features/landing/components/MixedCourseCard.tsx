import Link from "next/link";
import { BookOpen, Clock, Share2, ShoppingBag, Star, Users } from "lucide-react";
import type { MixedCourse } from "@/features/landing/api/landing.api";
import { LiveBadge } from "@/features/live-courses/LiveBadge";
import { AnimatedAvailability } from "@/features/live-courses/AnimatedAvailability";

/** Card for a `MixedCourse` (recorded or live, from `/courses/all-mixed`) — shared by the "All Courses" grid and any other section that lists both course types together. */
export function MixedCourseCard({ c }: { c: MixedCourse }) {
  const href = c.type === "live" ? `/${c.slug}` : `/courses/${c.slug}`;
  const price = parseFloat(c.price);
  const originalPrice = c.originalPrice ? parseFloat(c.originalPrice) : null;
  const isFree = price === 0;
  const hours = c.totalDuration > 0 ? Math.max(1, Math.round(c.totalDuration / 3600)) : 0;
  const badgeColor = c.type === "live" ? "#dc2626" : "#1f2937";
  const badgeLabel = c.type === "live" ? "Live Course" : "Recorded";

  return (
    <div className="group rounded-2xl bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <Link href={href} className="relative h-[190px] overflow-hidden bg-gray-100 dark:bg-gray-800 block shrink-0">
        {c.image ? (
          <img
            src={c.image}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-100 to-brand-200" />
        )}
        {c.showBadge !== false && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {c.type === "live" ? (
              <LiveBadge label={badgeLabel} color={badgeColor} />
            ) : (
              <span
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
                {badgeLabel}
              </span>
            )}
            {isFree && (
              <span className="rounded-md bg-green-500 px-2.5 py-1 text-xs font-bold text-white">
                Free
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-brand-600" />
            {c.totalLessons} Lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-600" />
            {hours} hours
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="mt-3 line-clamp-2 min-h-[48px] text-[15px] font-bold text-gray-900 dark:text-gray-100 hover:text-brand-600 transition-colors">
            {c.title}
          </h3>
        </Link>

        {/* Action row */}
        <div className="mt-3 flex items-center justify-between">
          {isFree ? (
            <span className="text-sm font-semibold text-brand-600">Enroll free !</span>
          ) : (
            <AnimatedAvailability />
          )}
          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
            <ShoppingBag className="h-4 w-4 hover:text-brand-600 cursor-pointer" />
            <Share2 className="h-4 w-4 hover:text-brand-600 cursor-pointer" />
          </div>
        </div>

        {/* Rating + students */}
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(c.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
                }`}
              />
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Users className="h-3.5 w-3.5" />
            {c.totalStudents.toLocaleString()} Students
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {isFree ? (
              <span className="text-2xl font-extrabold text-green-600">Free</span>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                  ৳ {price.toLocaleString()}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                    ৳ {originalPrice.toLocaleString()}
                  </span>
                )}
              </>
            )}
          </div>
          <Link
            href={href}
            className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
