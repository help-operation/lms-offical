import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 lg:block lg:w-1/2" />
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
