import { Skeleton } from "@repo/ui/skeleton";

export function PageHeroSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white dark:from-gray-900 dark:to-gray-900">
      <div className="container relative mx-auto px-4 py-12 text-center sm:py-16">
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto mt-4 h-4 w-full max-w-2xl" />
        {lines > 1 && <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-xl" />}
      </div>
    </section>
  );
}
