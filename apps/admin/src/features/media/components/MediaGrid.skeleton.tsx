// Server Component — no 'use client' needed
export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-100 dark:bg-slate-800" />
          <div className="p-2.5 space-y-1.5">
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MediaSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
              <div className="h-5 w-10 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
