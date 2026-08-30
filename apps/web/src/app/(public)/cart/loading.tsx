import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PageHeroSkeleton lines={1} />
      <div className="container mx-auto grid gap-6 px-4 py-12 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4">
              <Skeleton className="h-24 w-36 rounded-lg" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-fit space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </main>
  );
}
