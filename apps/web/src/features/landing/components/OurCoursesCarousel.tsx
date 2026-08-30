"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Users,
  Star,
  Play,
  Brain,
  Megaphone,
  Palette,
  Video,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryIconKey, LandingCategory, LandingCourse } from "@/features/landing/types";
import { LiveBadge } from "@/features/live-courses/LiveBadge";
import { AnimatedAvailability } from "@/features/live-courses/AnimatedAvailability";
import { useAutoplay } from "@/shared/hooks/useAutoplay";

const ICONS: Record<CategoryIconKey, LucideIcon> = {
  ai: Brain,
  marketing: Megaphone,
  graphic: Palette,
  content: Video,
  soft: Sparkles,
};

const CourseCard = ({ c }: { c: LandingCourse }) => (
  <div className="group shrink-0 w-[300px] md:w-[320px] rounded-2xl bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden">
    <Link href={`/courses/${c.slug}`} className="relative block h-[190px] overflow-hidden bg-gray-100 dark:bg-gray-700">
      <img
        src={c.image}
        alt={c.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      {c.showBadge !== false && (
        <div className="absolute top-3 left-3">
          {c.type === "live" ? (
            <LiveBadge />
          ) : (
            <span className="flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-bold text-white">
              <Play className="h-3 w-3 fill-white" />
              Recorded
            </span>
          )}
        </div>
      )}
    </Link>

    <div className="p-4">
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-brand-600" />
          {c.lessons} Lessons
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-brand-600" />
          {c.hours} hours
        </span>
      </div>

      <Link
        href={`/courses/${c.slug}`}
        className="mt-3 line-clamp-2 block min-h-[48px] text-[15px] font-bold text-gray-900 dark:text-white transition-colors hover:text-brand-600"
      >
        {c.title}
      </Link>

      <div className="mt-3">
        <AnimatedAvailability />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({c.reviews})</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Users className="h-3.5 w-3.5" />
          {c.students.toLocaleString()} Students
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white">৳ {c.price.toLocaleString()}</span>
          {c.oldPrice > c.price && (
            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">৳ {c.oldPrice.toLocaleString()}</span>
          )}
        </div>
        <Link
          href={`/courses/${c.slug}`}
          className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
        >
          Details
        </Link>
      </div>
    </div>
  </div>
);

export function OurCoursesCarousel({ categories }: { categories: LandingCategory[] }) {
  const [activeCat, setActiveCat] = useState(categories[0]?.key ?? "");
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const courses = useMemo(
    () => categories.find((c) => c.key === activeCat)?.courses ?? [],
    [activeCat, categories],
  );
  const n = courses.length;
  const loopCourses = n > 1 ? [...courses, ...courses] : courses;

  const cardStep = () => {
    const el = trackRef.current;
    if (!el) return 344;
    const first = el.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 24 : 344;
  };

  const scrollByDir = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  };

  const goTo = (i: number) => {
    trackRef.current?.scrollTo({ left: i * cardStep(), behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    setActive(0);
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setActive(Math.round(el.scrollLeft / cardStep()) % Math.max(1, n));
      if (n <= 1) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollTo({ left: el.scrollLeft - half, behavior: "instant" });
      }, 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(settleTimer);
    };
  }, [activeCat, n]);

  useAutoplay(() => scrollByDir(1), 4000, !paused && n > 1);

  return (
    <div
      className="relative rounded-3xl px-4 pb-8 pt-14 sm:px-8 lg:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top pill badge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-gradient-to-r from-brand-from to-brand-to px-8 py-3 text-base font-bold text-white shadow-lg">
          Our Courses
        </span>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => {
          const Icon = ICONS[cat.iconKey];
          const isActive = cat.key === activeCat;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{cat.name}</span>
                <span
                  className={`block text-xs ${
                    isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {cat.courses.length} courses
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Carousel container */}
      <div className="relative mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
        <button
          onClick={() => scrollByDir(-1)}
          aria-label="Previous"
          className="absolute -left-3 lg:-left-5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md hover:bg-brand-solid hover:text-white hover:border-brand-solid transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scrollByDir(1)}
          aria-label="Next"
          className="absolute -right-3 lg:-right-5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md hover:bg-brand-solid hover:text-white hover:border-brand-solid transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loopCourses.map((c, i) => (
            <CourseCard key={i < n ? c.id : `clone-${c.id}`} c={c} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {courses.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 cursor-pointer rounded-full transition-all ${
                active === i ? "w-6 bg-brand-solid" : "w-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
