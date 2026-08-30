import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for CoursesGridSection / CategoriesGridSection (Elevate
 * template) — mirrors the centered heading, optional filter pills, course
 * grid, and bottom CTA of `CoursesGridV2` / `CategoriesGridV2`. */
export function CoursesGridSectionSkeleton({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <Skeleton className="mx-auto h-4 w-32" />
          <Skeleton className="mx-auto mt-2 h-8 w-64 max-w-full" />
        </div>

        {showFilters && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-lg" />
            ))}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <Skeleton className="h-[190px] w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
