import { Skeleton } from "@repo/ui/skeleton";

/** Loading fallback for TestimonialSection — mirrors the heading, avatar
 * strip, and active-testimonial block so the page doesn't jump when the
 * carousel streams in. */
export function TestimonialSectionSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <Skeleton className="mx-auto h-9 w-80 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-96 max-w-full" />

        <div className="mx-auto mt-14 max-w-3xl">
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
            <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-2/3 max-w-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
