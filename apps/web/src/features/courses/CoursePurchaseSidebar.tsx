
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  Clock,
  PlayCircle,
  HelpCircle,
  FileText,
  BookOpen,
  Calendar,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EnrollButton } from "@/features/courses/EnrollButton";
import { SlideRenderer, ThumbItem } from "@/features/courses/CoursePreviewMedia";
import type { PreviewSlide } from "@/features/courses/api";
import { useAutoplay } from "@/shared/hooks/useAutoplay";

// ─── Component ────────────────────────────────────────────────────────────────

export function CoursePurchaseSidebar({
  course,
  price,
  discountPrice,
  isEnrolled,
  isLoggedIn,
  ctaLabels,
}: {
  course: {
    id: number;
    slug: string;
    previewPlaybackId: string | null;
    previewSlides: PreviewSlide[] | null;
    thumbnail: string | null;
    title: string;
    isFeatured?: boolean;
    totalStudents?: number;
    totalDuration?: number;
    totalLessons?: number;
    quizCount?: number;
    exerciseCount?: number;
    hasLifetimeAccess?: boolean;
    supportPhone?: string | null;
  };
  price: number;
  discountPrice: number | null;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  /** Admin-configurable global button labels. */
  ctaLabels?: { enroll: string; enrollFree: string; continueLearning: string };
  defaultPhone?: string;
}) {
  const slides = course.previewSlides ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [hovered, setHovered] = useState(false);

  function prev() { setUserInteracted(true); setActiveIdx((i) => Math.max(0, i - 1)); }
  function next() { setUserInteracted(true); setActiveIdx((i) => Math.min(slides.length - 1, i + 1)); }

  // Auto-advances through the preview slides until the visitor steps in
  // (hover or manual navigation) — avoids yanking a slide out from under
  // someone mid-way through watching an embedded video.
  useAutoplay(
    () => setActiveIdx((i) => (i + 1) % slides.length),
    4000,
    !userInteracted && !hovered && slides.length > 1,
  );

  const hours = Math.max(1, Math.round((course.totalDuration ?? 0) / 3600));
  const videos = course.totalLessons ?? 0;

  const includes = [
    { icon: Users,      label: `${(course.totalStudents ?? 0).toLocaleString()} students enrolled` },
    { icon: Clock,      label: `${hours} hours total` },
    { icon: PlayCircle, label: `${videos} videos` },
    ...(course.quizCount && course.quizCount > 0
      ? [{ icon: HelpCircle, label: `${course.quizCount} quiz sets` }]
      : []),
    ...(course.exerciseCount && course.exerciseCount > 0
      ? [{ icon: FileText, label: `${course.exerciseCount} practice exercises` }]
      : []),
    { icon: BookOpen, label: `${videos} notes` },
    ...(course.hasLifetimeAccess !== false
      ? [{ icon: Calendar, label: "Lifetime course access" }]
      : []),
  ];

  const activeSlide = slides[activeIdx] ?? null;

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Preview / Carousel ── */}
        <div className="relative overflow-hidden rounded-xl">
          {course.isFeatured && (
            <span className="absolute -left-9 top-3.5 z-10 -rotate-45 bg-amber-500 px-10 py-1 text-[10px] font-bold tracking-wide text-white shadow">
              POPULAR
            </span>
          )}

          <div className="relative aspect-video bg-gradient-to-br from-brand-100 to-brand-200">
            {/* ── Slide content ── */}
            {activeSlide ? (
              <SlideRenderer slide={activeSlide} />
            ) : course.thumbnail ? (
              <>
                <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                {/* Static play button hint */}
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <Play className="h-5 w-5 fill-brand-600 text-brand-600" />
                </span>
              </>
            ) : (
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Play className="h-5 w-5 fill-brand-600 text-brand-600" />
              </span>
            )}

            {/* Arrows — only shown when slides exist */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  disabled={activeIdx === 0}
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow transition-opacity disabled:opacity-30 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={activeIdx === slides.length - 1}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow transition-opacity disabled:opacity-30 hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Thumbnail strip ── */}
        {slides.length > 0 ? (
          /* Real slides — show only what was added */
          <div className="mt-3 flex gap-2">
            {slides.map((slide, i) => (
              <ThumbItem
                key={i}
                slide={slide}
                active={i === activeIdx}
                onClick={() => { setUserInteracted(true); setActiveIdx(i); }}
              />
            ))}
          </div>
        ) : (
          /* No slides configured — show 5 static placeholders */
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-video overflow-hidden rounded-md border border-gray-100 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
              >
                {course.thumbnail && (
                  <Image src={course.thumbnail} alt="" fill className="object-cover" />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-3 w-3 fill-white text-white drop-shadow" />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="px-3 pb-2 pt-5">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            {discountPrice ? (
              <>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  ৳ {discountPrice.toLocaleString()}
                </span>
                <span className="text-lg text-gray-400 line-through dark:text-gray-500">
                  ৳ {price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {price === 0 ? "Free" : `৳ ${price.toLocaleString()}`}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-4">
            <EnrollButton
              courseId={course.id}
              courseTitle={course.title}
              courseSlug={course.slug}
              price={price}
              isEnrolled={isEnrolled}
              isLoggedIn={isLoggedIn}
              labels={ctaLabels}
            />
          </div>

          {/* Lead capture */}
          {/* <div className="mt-5">
            <LeadCaptureBox courseId={course.id} />
          </div> */}

          {/* What's in this course */}
          <div className="mt-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              What&rsquo;s in this course
            </h3>
            <ul className="mt-3 space-y-3">
              {includes.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Icon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
