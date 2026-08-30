import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <main className="bg-white py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-gray-50 shadow-sm lg:grid-cols-2">
          <Skeleton className="hidden min-h-[520px] rounded-none lg:block" />
          <div className="space-y-5 p-8 sm:p-12">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>
    </main>
  );
}
