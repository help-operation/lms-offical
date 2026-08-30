import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <PageHeroSkeleton />
      <div className="container mx-auto space-y-10 px-4 py-16">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
