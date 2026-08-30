import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for StudentStoriesSection (Elevate template) — mirrors
 * the heading + horizontally-scrolling story card row. */
export function StudentStoriesSectionSkeleton() {
  return (
    <section className="bg-brand-50/60 dark:bg-gray-800 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="mx-auto mt-2 h-8 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-4 w-64 max-w-full" />
        </div>

        <div className="mt-10 flex gap-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex h-full shrink-0 basis-full gap-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm sm:basis-1/2 lg:basis-1/4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <Skeleton className="h-2.5 w-6 rounded-full" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
        </div>
      </div>
    </section>
  );
}
