import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for SuccessStoriesSection — mirrors the heading, filter
 * tabs, and video-card grid so the section doesn't jump when stories load. */
export function SuccessStoriesSectionSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <Skeleton className="mx-auto h-9 w-72 max-w-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-80 max-w-full" />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
    </section>
  );
}
