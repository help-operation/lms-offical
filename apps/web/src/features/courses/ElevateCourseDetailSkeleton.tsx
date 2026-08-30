import { Skeleton } from "@repo/ui/skeleton";

function Shimmer({ className }: { className: string }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} />;
}

/** Loading placeholder matching the Elevate course detail page's layout —
 * gradient hero, pill section nav, and a rounded-3xl sidebar card — so
 * there's no layout shift once the real content streams in. */
export function ElevateCourseDetailSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-800 dark:to-gray-950">
        <div className="container relative z-10 mx-auto px-4 pb-14 pt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-10 skeleton-shimmer bg-white/20" />
              <Skeleton className="h-3 w-3 rounded-full skeleton-shimmer bg-white/20" />
              <Skeleton className="h-3 w-14 skeleton-shimmer bg-white/20" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full skeleton-shimmer bg-white/20" />
          </div>

          <div className="lg:w-2/3">
            <Skeleton className="mb-3 h-6 w-28 rounded-full skeleton-shimmer bg-white/20" />
            <Skeleton className="h-9 w-full max-w-lg skeleton-shimmer bg-white/20" />
            <Skeleton className="mt-3 h-9 w-2/3 skeleton-shimmer bg-white/20" />
            <Skeleton className="mt-4 h-7 w-64 rounded-full skeleton-shimmer bg-white/15" />
            <Skeleton className="mt-4 h-4 w-full max-w-xl skeleton-shimmer bg-white/15" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-xl skeleton-shimmer bg-white/15" />
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar card */}
          <div className="order-first lg:order-last lg:col-span-1">
            <div className="mx-auto w-full max-w-[400px] lg:sticky lg:top-24 lg:mt-[-306px] lg:ml-auto">
              <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-xl shadow-brand-900/10 dark:border-brand-900/40 dark:bg-gray-900">
                <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
                <div className="p-3">
                  <Shimmer className="aspect-video w-full rounded-2xl" />
                  <div className="mt-3 flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Shimmer key={i} className="aspect-video w-full rounded-md" />
                    ))}
                  </div>
                  <div className="px-1 pb-1 pt-5">
                    <Skeleton className="h-9 w-32 skeleton-shimmer" />
                    <Skeleton className="mt-4 h-11 w-full rounded-xl skeleton-shimmer" />
                    <div className="mt-6 space-y-3 rounded-2xl bg-brand-50/60 p-4 dark:bg-brand-500/10">
                      <Skeleton className="h-4 w-32 skeleton-shimmer" />
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-7 w-7 shrink-0 rounded-lg skeleton-shimmer" />
                          <Skeleton className="h-3.5 w-full skeleton-shimmer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-8 sm:space-y-12 lg:col-span-2 lg:pt-10">
            {/* Pill section nav */}
            <div className="-mx-4 flex gap-2 overflow-hidden border-b border-brand-100 px-4 py-3 dark:border-gray-800">
              {[96, 128, 112, 120, 104, 80].map((w, i) => (
                <Skeleton key={i} className="h-8 shrink-0 rounded-xl skeleton-shimmer" style={{ width: `${w}px` }} />
              ))}
            </div>

            {/* Instructor card */}
            <div>
              <Skeleton className="mb-5 h-7 w-40 skeleton-shimmer" />
              <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
                <div className="flex items-start gap-4 p-6">
                  <Shimmer className="h-[76px] w-[76px] shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40 skeleton-shimmer" />
                    <Skeleton className="h-3.5 w-28 skeleton-shimmer" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-7 w-24 rounded-full skeleton-shimmer" />
                      <Skeleton className="h-7 w-24 rounded-full skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facility grid */}
            <div>
              <Skeleton className="mb-5 h-7 w-64 skeleton-shimmer" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-brand-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <Skeleton className="h-11 w-11 rounded-xl skeleton-shimmer" />
                    <Skeleton className="mt-3 h-4 w-2/3 skeleton-shimmer" />
                    <Skeleton className="mt-2 h-3 w-full skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Generic text section */}
            <div>
              <Skeleton className="mb-5 h-7 w-48 skeleton-shimmer" />
              <div className="rounded-2xl border border-brand-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
