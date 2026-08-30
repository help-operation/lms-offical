import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for AllCoursesSection — mirrors its heading + filter
 * pills + grid layout so swapping in real content doesn't reshape the page. */
export function AllCoursesSectionSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-950 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="hidden h-6 w-24 sm:block" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-md" />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-lg"
            >
              <Skeleton className="h-[190px] w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-2 h-5 w-2/3" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
