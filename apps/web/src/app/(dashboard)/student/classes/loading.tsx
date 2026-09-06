import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
