import { BlogCardSkeleton } from "@/features/blog/BlogCardSkeleton";

export default function BlogLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-hero to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container relative mx-auto px-4 py-16 text-center">
          <div className="mx-auto h-10 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mx-auto mt-4 h-4 w-96 max-w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </section>

      {/* Grid skeleton */}
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
