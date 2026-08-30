import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";
import { BlogCardSkeleton } from "@/features/blog/BlogCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <PageHeroSkeleton lines={1} />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
