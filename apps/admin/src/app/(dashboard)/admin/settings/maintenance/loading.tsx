import { Skeleton } from "@repo/ui/skeleton";

function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
      {children}
    </div>
  );
}

function CardHeaderSkeleton({ widthClass = "w-40" }: { widthClass?: string }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className={`h-4 ${widthClass}`} />
        <Skeleton className="h-3 w-full max-w-sm" />
      </div>
    </div>
  );
}

export default function MaintenanceLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 sm:h-7 sm:w-52" />
              <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
            </div>
          </div>
          <Skeleton className="h-6 w-32 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          {/* Toggle + Site Status */}
          <CardSkeleton>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <CardHeaderSkeleton widthClass="w-44" />
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
                <div className="hidden h-10 w-px bg-gray-200 dark:bg-slate-700 sm:block" />
                <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 sm:flex-none sm:px-4 sm:py-2.5">
                  <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardSkeleton>

          {/* Message editor */}
          <CardSkeleton>
            <div className="mb-4">
              <CardHeaderSkeleton widthClass="w-48" />
            </div>
            <Skeleton className="h-28 w-full rounded-lg sm:h-24" />
            <div className="mt-3 flex justify-end">
              <Skeleton className="h-10 w-full rounded-lg sm:w-32" />
            </div>
          </CardSkeleton>

          {/* Preview */}
          <CardSkeleton>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <CardHeaderSkeleton widthClass="w-24" />
              <Skeleton className="h-9 w-full rounded-lg sm:w-40" />
            </div>
            <Skeleton className="h-56 w-full rounded-lg sm:h-64" />
          </CardSkeleton>
        </div>

        {/* Sidebar */}
        <div className="h-fit rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <Skeleton className="mb-2 h-11 w-11 rounded-lg" />
          <Skeleton className="h-4 w-48" />
          <div className="mt-2 space-y-1.5 border-b border-gray-100 py-2 dark:border-slate-700">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          <div className="mt-3 divide-y divide-gray-100 dark:divide-slate-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
