import { Skeleton } from "@repo/ui/skeleton";

/** Mirrors BlogCard's layout (framed thumbnail with a floating category
 * pill, title, excerpt, author row, footer stats) so the grid doesn't
 * shift when real posts stream in. */
export function BlogCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="relative h-48 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Skeleton className="absolute inset-3 rounded-xl skeleton-shimmer" />
        <Skeleton className="absolute left-3 top-3 h-6 w-16 rounded-full skeleton-shimmer" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-4 w-full skeleton-shimmer" />
        <Skeleton className="mt-2 h-4 w-2/3 skeleton-shimmer" />
        <Skeleton className="mt-3 h-3.5 w-full skeleton-shimmer" />
        <Skeleton className="mt-1.5 h-3.5 w-4/5 skeleton-shimmer" />
        <div className="mt-4 flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full skeleton-shimmer" />
          <Skeleton className="h-3.5 w-28 skeleton-shimmer" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
          <Skeleton className="h-3 w-16 skeleton-shimmer" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-12 skeleton-shimmer" />
            <Skeleton className="h-3 w-16 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
