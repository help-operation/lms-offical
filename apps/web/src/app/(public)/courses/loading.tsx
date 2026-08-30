import { Skeleton } from "@repo/ui/skeleton";
import { CourseGridSkeleton } from "@/features/courses/CourseCard.skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white dark:from-gray-900 dark:to-gray-900">
        <div className="container relative mx-auto px-4 py-16 text-center">
          <Skeleton className="mx-auto h-10 w-64 skeleton-shimmer" />
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-3xl skeleton-shimmer" />
          <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-2xl skeleton-shimmer" />
          <div className="mt-8 flex justify-center gap-3">
            <Skeleton className="h-10 w-28 rounded-full skeleton-shimmer" />
            <Skeleton className="h-10 w-28 rounded-full skeleton-shimmer" />
            <Skeleton className="h-10 w-28 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 skeleton-shimmer" />
          <Skeleton className="h-10 w-40 rounded-md skeleton-shimmer" />
        </div>
        <CourseGridSkeleton count={8} />
      </div>
    </main>
  );
}
