import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for StudentReviewsSection — mirrors the two-column
 * heading + scrolling review cards layout. */
export function StudentReviewsSectionSkeleton() {
  return (
    <section className="overflow-hidden bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 xl:grid-cols-[360px_1fr]">
          <div>
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="mt-5 h-4 w-full max-w-md" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
            <Skeleton className="mt-7 h-11 w-32 rounded-md" />
          </div>

          <div className="flex gap-6 overflow-hidden px-2 py-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-[320px] md:w-[400px] shrink-0 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
