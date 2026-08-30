import { Skeleton } from "@repo/ui/skeleton";

export function ProseSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Skeleton className="h-9 w-2/3" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-1/2" : "w-full"}`} />
        ))}
      </div>
    </main>
  );
}
