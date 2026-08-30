"use client";

import { Star } from "lucide-react";
import type { CourseReviews } from "@/features/courses/api";
import { StarRow, ReviewsSlider } from "@/features/courses/CourseReviewsMedia";

export function ElevateCourseReviewsSection({ data }: { data: CourseReviews }) {
  if (data.total === 0) {
    return (
      <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Student Reviews</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No reviews yet. Be the first to enroll and share your experience!
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
      <div className="p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Student Reviews</h3>

        {/* Rating summary bar */}
        <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50/60 p-5 sm:flex-row dark:from-gray-800 dark:to-gray-800">
          <div className="flex shrink-0 flex-col items-center justify-center">
            <span className="text-5xl font-bold text-brand-700 dark:text-brand-400">{data.avg.toFixed(1)}</span>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(data.avg) ? "fill-amber-400 text-amber-400" : "text-gray-300 fill-gray-200 dark:text-gray-700 dark:fill-gray-700"}`} />
              ))}
            </div>
            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Course Rating</span>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((r) => (
              <StarRow key={r} rating={r} count={data.distribution[r] ?? 0} total={data.total} />
            ))}
          </div>
        </div>

        {/* All reviews — single horizontal slider */}
        {data.reviews.length > 0 && <ReviewsSlider reviews={data.reviews} />}
      </div>
    </section>
  );
}
