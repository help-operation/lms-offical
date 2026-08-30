import { Skeleton } from "@repo/ui/skeleton";

export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Skeleton className="h-[190px] w-full rounded-none skeleton-shimmer" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20 skeleton-shimmer" />
          <Skeleton className="h-4 w-16 skeleton-shimmer" />
        </div>
        <Skeleton className="mt-3 h-5 w-full skeleton-shimmer" />
        <Skeleton className="mt-2 h-5 w-2/3 skeleton-shimmer" />
        <Skeleton className="mt-3 h-4 w-32 skeleton-shimmer" />
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-700">
          <Skeleton className="h-4 w-28 skeleton-shimmer" />
          <Skeleton className="h-4 w-20 skeleton-shimmer" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-8 w-24 skeleton-shimmer" />
          <Skeleton className="h-9 w-20 rounded-md skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
