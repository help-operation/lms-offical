import { Skeleton } from "@repo/ui/skeleton";

function SectionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export default function SettingsHubLoading() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 sm:h-7 sm:w-52" />
            <Skeleton className="h-3.5 w-72 max-w-full sm:w-96" />
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SectionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
