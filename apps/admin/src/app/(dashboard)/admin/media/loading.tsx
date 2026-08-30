import { MediaGridSkeleton, MediaSummarySkeleton } from "@/features/media/components/MediaGrid.skeleton";

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
      </div>

      {/* Filters bar */}
      <div className="flex gap-3">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
        <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
        <div className="ml-auto h-9 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
      </div>

      {/* Summary stats */}
      <MediaSummarySkeleton />

      {/* Grid */}
      <MediaGridSkeleton />
    </div>
  );
}
