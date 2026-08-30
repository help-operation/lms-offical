import { Skeleton } from "@repo/ui/skeleton";

function ProviderTileSkeleton() {
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

export default function ConfigactionSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 sm:h-7 sm:w-44" />
            <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Notice banner */}
        <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>

        {/* Provider tiles — R2 + Bunny Stream */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ProviderTileSkeleton />
          <ProviderTileSkeleton />
        </div>
      </div>
    </div>
  );
}
