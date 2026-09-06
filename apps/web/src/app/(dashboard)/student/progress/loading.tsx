import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
