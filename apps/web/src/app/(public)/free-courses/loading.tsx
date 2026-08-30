import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <PageHeroSkeleton />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Skeleton className="mx-auto h-5 w-3/4" />
          <Skeleton className="mx-auto mt-3 h-4 w-1/2" />
        </div>
      </div>
    </main>
  );
}
