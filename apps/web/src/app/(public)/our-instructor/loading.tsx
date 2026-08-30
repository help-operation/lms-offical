import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <PageHeroSkeleton />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <Skeleton className="mx-auto h-24 w-24 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-5 w-32" />
              <Skeleton className="mx-auto mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
