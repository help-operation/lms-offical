import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto mt-4 h-4 w-full max-w-xl" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
