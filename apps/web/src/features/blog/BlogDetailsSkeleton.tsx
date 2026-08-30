import { Skeleton } from "@repo/ui/skeleton";

function Shimmer({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} style={style} />;
}

/** Mirrors the blog detail page's layout — thumbnail, header, prose body,
 * engagement bar, and comment thread — so nothing shifts once the post,
 * likes, and comments have streamed in. Used both as the route's
 * `loading.tsx` and as the inner Suspense fallback in `page.tsx`. */
export function BlogDetailsSkeleton() {
  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Skeleton className="h-full w-full rounded-none skeleton-shimmer" />
      </div>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="h-9 w-full max-w-lg" />
          <Shimmer className="h-9 w-2/3 max-w-md" />
        </div>

        {/* Meta */}
        <div className="mb-8 flex items-center gap-4">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-4 w-40" />
        </div>

        <div className="mb-8 border-l-4 border-brand-100 pl-4 dark:border-gray-700">
          <Shimmer className="h-4 w-full" />
          <Shimmer className="mt-2 h-4 w-4/5" />
        </div>

        {/* Content */}
        <div className="mb-10 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-4" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>

        {/* Engagement bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-gray-100 dark:border-gray-800">
          <Shimmer className="h-10 w-28 rounded-full" />
          <div className="flex items-center gap-2">
            <Shimmer className="h-9 w-16 rounded-full" />
            <Shimmer className="h-9 w-9 rounded-full" />
            <Shimmer className="h-9 w-9 rounded-full" />
            <Shimmer className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* Comments */}
        <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <Shimmer className="h-6 w-40 mb-6" />
          <div className="space-y-4 mb-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Shimmer className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <Shimmer className="h-3.5 w-32 mb-2" />
                  <Shimmer className="h-3.5 w-full" />
                  <Shimmer className="mt-1.5 h-3.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Shimmer className="h-8 w-8 rounded-full shrink-0" />
            <Shimmer className="h-20 flex-1 rounded-xl" />
          </div>
        </section>
      </article>
    </div>
  );
}
