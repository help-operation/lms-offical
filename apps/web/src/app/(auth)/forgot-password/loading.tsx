import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <main className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-md space-y-5 rounded-3xl bg-gray-50 p-8 shadow-sm sm:p-10">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </main>
  );
}
