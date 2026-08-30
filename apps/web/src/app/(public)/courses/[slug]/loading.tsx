import { Skeleton } from "@repo/ui/skeleton";
import { getPublicSiteSettings } from "@/features/cms/api/settings";
import { ElevateCourseDetailSkeleton } from "@/features/courses/ElevateCourseDetailSkeleton";
import { MasteryCourseDetailSkeleton } from "@/features/courses/MasteryCourseDetailSkeleton";

function FoundationCourseDetailSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero header */}
      <section className="bg-ink-strong/95 dark:bg-gray-900">
        <div className="container mx-auto px-4 pb-44 pt-12">
          <Skeleton className="h-5 w-40 bg-white/20 skeleton-shimmer" />
          <Skeleton className="mt-4 h-9 w-3/4 bg-white/20 skeleton-shimmer" />
          <Skeleton className="mt-3 h-9 w-1/2 bg-white/20 skeleton-shimmer" />
          <div className="mt-6 flex gap-4">
            <Skeleton className="h-4 w-24 bg-white/20 skeleton-shimmer" />
            <Skeleton className="h-4 w-24 bg-white/20 skeleton-shimmer" />
            <Skeleton className="h-4 w-24 bg-white/20 skeleton-shimmer" />
          </div>
        </div>
      </section>

      {/* Body grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar card */}
          <div className="order-first lg:order-last lg:col-span-1">
            <div className="mx-auto w-full max-w-[400px] lg:sticky lg:top-24 lg:mt-[-370px] lg:ml-auto">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <Skeleton className="h-48 w-full rounded-xl skeleton-shimmer" />
                <Skeleton className="mt-4 h-8 w-32 skeleton-shimmer" />
                <Skeleton className="mt-4 h-11 w-full rounded-md skeleton-shimmer" />
                <Skeleton className="mt-3 h-11 w-full rounded-md skeleton-shimmer" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-2/3 skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6 lg:col-span-2 lg:pt-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Skeleton className="h-6 w-48 skeleton-shimmer" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// Course detail route is Mastery template (template 2) for recorded bundles —
// always show Mastery skeleton so the 1-2s loading matches the final page
// (your gif showed Elevate skeleton for aa-6 because home_template === "home-v1" returned Elevate).
export default async function Loading() {
  return <MasteryCourseDetailSkeleton />;
}
