import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

function Shimmer({ className }: { className: string }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} />;
}

/** Mirrors the FAQ page's accordion layout — hero, category heading, and
 * question cards — so the page doesn't reflow once CMS content loads. */
export function FaqSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <PageHeroSkeleton lines={1} />

      <section className="bg-white py-16 dark:bg-gray-900 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          {Array.from({ length: 2 }).map((_, catIndex) => (
            <div key={catIndex} className="mb-14 last:mb-0">
              <div className="mb-8 flex flex-col items-center gap-3">
                <Skeleton className="h-1 w-10 rounded-full skeleton-shimmer" />
                <Shimmer className="h-7 w-56" />
              </div>

              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 px-5 py-4 dark:border-gray-700 sm:px-6"
                  >
                    <Shimmer className="h-5 w-2/3" />
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
