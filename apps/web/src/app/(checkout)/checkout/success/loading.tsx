import { Skeleton } from "@repo/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-7 w-48" />
        <Skeleton className="mx-auto mt-3 h-4 w-full" />
        <Skeleton className="mx-auto mt-2 h-4 w-2/3" />
        <Skeleton className="mx-auto mt-6 h-11 w-40 rounded-md" />
      </div>
    </main>
  );
}
