import Link from "next/link";
import { Play, BookOpen, Clock, Users, Star, ShoppingBag, Share2 } from "lucide-react";
import { getLiveCourses } from "@/features/landing/api/landing.api";
import type { LandingCourse } from "@/features/landing/types";
import { LiveBadge } from "@/features/live-courses/LiveBadge";
import { AnimatedAvailability } from "@/features/live-courses/AnimatedAvailability";

export type BatchesGridContent = {
  /** Legacy CMS field — was a hardcoded batches list. Ignored now. */
  batches?: unknown;
};

type Props = { content?: BatchesGridContent };

const BatchCard = ({ b }: { b: LandingCourse }) => (
  <div className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
    <div className="relative h-44 overflow-hidden bg-gray-100">
      <img
        src={b.image}
        alt={b.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute left-3 top-3 flex items-center gap-2">
        {b.type === "live" ? (
          <LiveBadge />
        ) : (
          <span className="flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-bold text-white">
            <Play className="h-3 w-3 fill-white" />
            Recorded
          </span>
        )}
      </div>
    </div>

    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-brand-600" />
          {b.lessons} Lessons
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-brand-600" />
          {b.hours} hours
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[44px] text-[15px] font-bold text-gray-900">
        {b.title}
      </h3>

      <div className="mt-3 flex items-center justify-between">
        <AnimatedAvailability />
        <div className="flex items-center gap-3 text-gray-400">
          <ShoppingBag className="h-4 w-4 cursor-pointer hover:text-brand-600" />
          <Share2 className="h-4 w-4 cursor-pointer hover:text-brand-600" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1 text-xs text-gray-500">({b.reviews})</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5" />
          {b.students.toLocaleString()} Students
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-gray-900">
            ৳ {b.price.toLocaleString()}
          </span>
          {b.oldPrice > b.price && (
            <span className="text-sm text-gray-400 line-through">
              ৳ {b.oldPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Link
          href="/courses"
          className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
        >
          Details
        </Link>
      </div>
    </div>
  </div>
);

const BatchesGrid = async (_: Props) => {
  const batches = await getLiveCourses(24);

  if (batches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No upcoming live batches right now — check back soon!
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {batches.map((b) => (
          <BatchCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
};

export default BatchesGrid;
