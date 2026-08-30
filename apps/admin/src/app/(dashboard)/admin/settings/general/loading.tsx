import { Skeleton } from "@repo/ui/skeleton";

function CategoryTileSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32 max-w-full" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="mt-1.5 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export default function GeneralSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 sm:h-7 sm:w-52" />
            <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Category tiles */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CategoryTileSkeleton key={i} />
          ))}
        </div>

        {/* Cache card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="mb-4 h-3 w-4/5" />
          <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
        </div>
      </div>
    </div>
  );
}
