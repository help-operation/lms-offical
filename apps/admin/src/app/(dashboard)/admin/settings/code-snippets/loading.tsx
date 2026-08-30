import { Skeleton } from "@repo/ui/skeleton";

function SnippetCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Toggle */}
        <Skeleton className="mt-0.5 h-5 w-9 shrink-0 rounded-full" />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton className="h-9 w-9 rounded-lg sm:h-8 sm:w-8" />
          <Skeleton className="h-9 w-9 rounded-lg sm:h-8 sm:w-8" />
        </div>
      </div>
    </div>
  );
}

export default function CodeSnippetsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 sm:h-7 sm:w-52" />
            <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Status bar */}
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg sm:w-36" />
        </div>

        {/* Snippet list */}
        <div className="space-y-3">
          <SnippetCardSkeleton />
          <SnippetCardSkeleton />
          <SnippetCardSkeleton />
        </div>
      </div>
    </div>
  );
}
