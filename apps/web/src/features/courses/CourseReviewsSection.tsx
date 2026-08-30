"use client";

import { Star } from "lucide-react";
import type { CourseReviews } from "@/features/courses/api";
import { StarRow, ReviewsSlider } from "@/features/courses/CourseReviewsMedia";

export function CourseReviewsSection({ data }: { data: CourseReviews }) {
  if (data.total === 0) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">Student Reviews</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No reviews yet. Be the first to enroll and share your experience!
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">Student Reviews</h3>

      {/* Rating summary bar */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-amber-50 rounded-2xl dark:bg-amber-500/10">
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className="text-5xl font-bold text-amber-500">{data.avg.toFixed(1)}</span>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(data.avg) ? "fill-amber-400 text-amber-400" : "text-gray-300 fill-gray-200 dark:text-gray-600 dark:fill-gray-700"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500 mt-1 dark:text-gray-400">Course Rating</span>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((r) => (
            <StarRow key={r} rating={r} count={data.distribution[r] ?? 0} total={data.total} />
          ))}
        </div>
      </div>

      {/* All reviews — single horizontal slider */}
      {data.reviews.length > 0 && <ReviewsSlider reviews={data.reviews} />}
    </section>
  );
}
