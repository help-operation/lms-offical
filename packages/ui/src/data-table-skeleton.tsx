import { cn } from "../utils";

interface DataTableSkeletonProps {
  /** Number of table columns to show */
  columns?: number;
  /** Number of skeleton rows to show */
  rows?: number;
  /** Show the search bar skeleton */
  searchable?: boolean;
  /** Number of filter dropdown skeletons */
  filters?: number;
  /** Show pagination skeleton */
  showPagination?: boolean;
  className?: string;
}

export function DataTableSkeleton({
  columns = 4,
  rows = 5,
  searchable = true,
  filters = 0,
  showPagination = true,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>

      {/* Search + Filters */}
      {(searchable || filters > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="h-9 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800 sm:w-72" />
          )}
          {filters > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: filters }).map((_, i) => (
                <div key={i} className="h-9 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {Array.from({ length: rows }).map((_, ri) => (
                <tr key={ri} className="animate-pulse">
                  {Array.from({ length: columns }).map((_, ci) => (
                    <td key={ci} className="px-6 py-4">
                      <div
                        className={cn(
                          "h-4 rounded bg-gray-200 dark:bg-slate-700",
                          ci === 0             ? "w-36" :
                          ci === columns - 1   ? "w-16" :
                                                 "w-24",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          {/* Left: showing text + page size */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800" />
          </div>
          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
