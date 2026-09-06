import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      {/* Greeting */}
      <Skeleton className="h-24 w-full rounded-2xl" />
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
