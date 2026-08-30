import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for the landing course/batch carousels. */
export function CourseRowSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="hidden h-6 w-24 sm:block" />
        </div>
        <div className="mt-14 flex gap-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm md:w-[320px]"
            >
              <Skeleton className="h-[190px] w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-2 h-5 w-2/3" />
                <Skeleton className="mt-3 h-4 w-32" />
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
