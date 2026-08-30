import { Skeleton } from "@repo/ui/skeleton";

function Shimmer({ className }: { className: string }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} />;
}

/** Mirrors the /certificate/[code] page's layout — header bar, verified
 * badge, certificate card, action row, and footer note — so the page
 * doesn't shift once the certificate record has been verified server-side. */
export function CertificateSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg skeleton-shimmer" />
            <Shimmer className="h-5 w-24" />
          </div>
          <Shimmer className="h-10 w-36 rounded-xl" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        {/* Verification badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-100 px-6 py-3.5 dark:border-gray-800">
            <Skeleton className="h-9 w-9 rounded-full shrink-0 skeleton-shimmer" />
            <div>
              <Shimmer className="h-3.5 w-40" />
              <Shimmer className="mt-1.5 h-3 w-56" />
            </div>
          </div>
        </div>

        {/* Certificate card */}
        <div className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden dark:border-gray-800">
          <div className="h-2 bg-gray-100 dark:bg-gray-800" />

          <div className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-20 w-20 rounded-2xl skeleton-shimmer" />
            </div>

            <div className="space-y-2">
              <Shimmer className="mx-auto h-3.5 w-48" />
              <Shimmer className="mx-auto h-4 w-40" />
            </div>

            <Shimmer className="mx-auto h-10 w-72 max-w-full" />

            <div className="space-y-2">
              <Shimmer className="mx-auto h-4 w-56" />
              <Shimmer className="mx-auto h-6 w-64 max-w-full" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <Shimmer className="h-3 w-20 mb-2" />
                <Shimmer className="h-4 w-24" />
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <Shimmer className="h-3 w-24 mb-2" />
                <Shimmer className="h-4 w-28" />
              </div>
            </div>

            <div className="flex items-end justify-center gap-16 pt-4">
              <div className="text-center">
                <Shimmer className="mx-auto h-8 w-24 mb-1.5" />
                <div className="h-px w-32 bg-gray-200 dark:bg-gray-700 mx-auto mb-1.5" />
                <Shimmer className="mx-auto h-3 w-28" />
              </div>
            </div>
          </div>

          <div className="h-1 bg-gray-100 dark:bg-gray-800" />
        </div>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Shimmer className="h-11 w-full sm:w-52 rounded-xl" />
          <Shimmer className="h-11 w-full sm:w-40 rounded-xl" />
        </div>

        {/* Footer note */}
        <div className="flex justify-center">
          <Shimmer className="h-3.5 w-72 max-w-full" />
        </div>
      </main>
    </div>
  );
}
