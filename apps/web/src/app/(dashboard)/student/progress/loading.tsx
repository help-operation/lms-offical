import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* 6 stat cards */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      {/* Overall progress */}
      <Skeleton className="h-[72px] rounded-xl" />
      {/* Course list */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-12 rounded-t-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] border-t border-slate-100 dark:border-slate-800" />
        ))}
      </div>
    </div>
  );
}
