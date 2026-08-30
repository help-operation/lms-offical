import { Skeleton } from "@repo/ui/skeleton";
import { DataTableSkeleton } from "@repo/ui/data-table-skeleton";

/** Loading skeleton for admin list/table pages (title + DataTable). */
export function TablePageSkeleton({
  columns = 5,
  rows = 8,
  filters = 0,
}: {
  columns?: number;
  rows?: number;
  filters?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTableSkeleton columns={columns} rows={rows} filters={filters} />
        </div>
      </div>
    </div>
  );
}
