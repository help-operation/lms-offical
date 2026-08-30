import { Skeleton } from "@repo/ui/skeleton";

function MenuRowSkeleton() {
  return (
    <li className="flex items-center gap-2 px-4 py-3.5 sm:gap-3 sm:px-5">
      {/* Reorder */}
      <div className="flex shrink-0 flex-col gap-1">
        <Skeleton className="h-3.5 w-3.5" />
        <Skeleton className="h-3.5 w-3.5" />
      </div>

      {/* Label + url */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Skeleton className="h-9 w-9 rounded-lg sm:h-8 sm:w-8" />
        <Skeleton className="h-9 w-9 rounded-lg sm:h-8 sm:w-8" />
        <Skeleton className="h-9 w-9 rounded-lg sm:h-8 sm:w-8" />
      </div>
    </li>
  );
}

export default function MenusLoading() {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-1 flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <Skeleton className="h-5 w-28 sm:h-6" />
        </div>
        <Skeleton className="ml-12 h-3 w-72 max-w-full sm:h-4" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          {/* Menu tabs */}
          <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>

          {/* Active menu panel */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl sm:w-28" />
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              <MenuRowSkeleton />
              <MenuRowSkeleton />
              <MenuRowSkeleton />
              <MenuRowSkeleton />
              <MenuRowSkeleton />
            </ul>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-4">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800/50">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
            <Skeleton className="mt-3 h-3 w-full max-w-[220px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
