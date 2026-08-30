"use client";

import Link from "next/link";
import { Play, BookOpen, Clock, Users, Star } from "lucide-react";
import type { PublicCourse } from "@/features/courses/api";
import { AnimatedAvailability } from "@/features/live-courses/AnimatedAvailability";
import { trackSelectItem } from "@/shared/utils/dataLayer";

interface CourseCardProps {
  course: PublicCourse;
  enrolled?: boolean;
  /** Which listing this card renders in (e.g. "Courses page", "Top courses") — passed through as GA4's item_list_name. */
  listName?: string;
}

export function CourseCard({ course, enrolled = false, listName }: CourseCardProps) {
  const price = parseFloat(course.price);
  const discountPrice = course.discountPrice ? parseFloat(course.discountPrice) : null;
  const hasDiscount = discountPrice !== null && !Number.isNaN(discountPrice) && discountPrice < price;
  const mainPrice = hasDiscount ? discountPrice : price;
  const oldPrice = hasDiscount ? price : null;

  const rating = course.rating ? parseFloat(course.rating) : 0;
  const filledStars = Math.round(rating);
  const hours =
    course.totalDuration > 0 ? Math.max(1, Math.round(course.totalDuration / 3600)) : 0;

  function handleSelect() {
    trackSelectItem({ item_id: String(course.id), item_name: course.title, price: mainPrice }, listName);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Thumbnail */}
      <Link href={`/courses/${course.slug}`} onClick={handleSelect} className="relative block h-[190px] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-800 dark:to-gray-700">
            <BookOpen className="h-12 w-12 text-brand-300" />
          </div>
        )}
        {course.showBadge !== false && (
          <div className="absolute left-3 top-3">
            <span className="flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-bold text-white">
              <Play className="h-3 w-3 fill-white" />
              Recorded
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            {course.totalLessons} Lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            {hours} hours
          </span>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          onClick={handleSelect}
          className="mt-3 line-clamp-2 min-h-[48px] text-[15px] font-bold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
        >
          {course.title}
        </Link>

        <div className="mt-3">
          {enrolled ? (
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Enrolled</span>
          ) : (
            <AnimatedAvailability />
          )}
        </div>

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
            {course.totalStudents.toLocaleString()} Students
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {enrolled ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                ✓ Enrolled
              </span>
              <Link
                href={`/courses/${course.slug}`}
                className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
              >
                Continue
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {mainPrice === 0 ? "Free" : `৳ ${mainPrice.toLocaleString()}`}
                </span>
                {oldPrice && oldPrice > mainPrice && (
                  <span className="text-sm text-gray-400 line-through dark:text-gray-500">
                    ৳ {oldPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <Link
                href={`/courses/${course.slug}`}
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
