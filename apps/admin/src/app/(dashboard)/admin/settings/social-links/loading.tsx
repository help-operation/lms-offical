import { Skeleton } from "@repo/ui/skeleton";

function FieldSkeleton() {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
      </div>
      <div className="relative">
        <Skeleton className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-sm" />
        <Skeleton className="h-[42px] w-full rounded-lg" />
      </div>
      <Skeleton className="mt-1.5 h-3 w-4/5 max-w-sm" />
    </div>
  );
}

export default function SocialLinksLoading() {
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
        {/* Live preview */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-800/50">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
            <Skeleton className="mt-3 h-3 w-full max-w-[260px]" />
          </div>
        </div>

        {/* Fields */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <FieldSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex justify-end">
          <div className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-slate-800 sm:w-36">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
