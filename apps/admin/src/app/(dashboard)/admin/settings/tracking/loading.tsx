import { Skeleton } from "@repo/ui/skeleton";

function FieldSkeleton() {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      <div className="relative">
        <Skeleton className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-sm" />
        <Skeleton className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg" />
        <Skeleton className="h-[42px] w-full rounded-lg" />
      </div>
      <Skeleton className="mt-1.5 h-3 w-4/5 max-w-md" />
    </div>
  );
}

export default function TrackingSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-28 sm:h-7 sm:w-32" />
            <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* GTM notice */}
        <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>

        {/* Fields */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-full rounded-lg sm:w-36" />
        </div>
      </div>
    </div>
  );
}
