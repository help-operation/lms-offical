import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <PageHeroSkeleton />
      <div className="container mx-auto space-y-12 px-4 py-16">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="mx-auto h-7 w-56" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
