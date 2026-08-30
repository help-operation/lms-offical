import { Skeleton } from "@repo/ui/skeleton";

function Shimmer({ className }: { className: string }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} />;
}

/** Loading placeholder matching the Mastery recorded-course landing page —
 * mint sticky offer bar, hero with purple thumbnail, batch cards, curriculum
 * accordion — so the real content doesn't pop in over a mismatched skeleton
 * and the website header is already hidden (no 1-2s flash of 2 headers). */
export function MasteryCourseDetailSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      {/* Server-side hide of the public website header (Home | All Courses ...) — matches page.tsx */}
      <style dangerouslySetInnerHTML={{ __html: `header{display:none!important} body>header{display:none!important}` }} />

      {/* Sticky offer bar skeleton — mint bar with timer + price + Enroll */}
      <div className="h-[56px] bg-[#eafff2] border-b border-green-100 flex items-center justify-between px-4 max-w-[1160px] mx-auto">
        <div className="flex items-center gap-2">
          <Shimmer className="h-4 w-24" />
          <div className="flex gap-1">
            <Shimmer className="h-7 w-9 rounded" />
            <Shimmer className="h-7 w-9 rounded" />
            <Shimmer className="h-7 w-9 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-8 w-24 rounded-lg" />
          <Shimmer className="h-8 w-20 rounded-lg bg-green-600/20" />
        </div>
      </div>

      {/* Hero — matches MasteryCourseHero layout: left text + right purple thumbnail */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1160px] px-[10px] py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-5 pt-6 lg:pt-8">
              <Shimmer className="h-8 w-3/4" />
              <Shimmer className="h-8 w-1/2" />
              <div className="flex items-center gap-2">
                <Shimmer className="h-4 w-16" />
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-5/6" />
              </div>
              <div className="flex items-center gap-4">
                <Shimmer className="h-10 w-36 rounded-sm" />
                <Shimmer className="h-6 w-20" />
                <Shimmer className="h-6 w-16 rounded-full" />
              </div>
              <Shimmer className="h-4 w-64" />
              <div className="flex gap-3 pt-2">
                <Shimmer className="h-6 w-20 rounded" />
                <Shimmer className="h-6 w-20 rounded" />
                <Shimmer className="h-6 w-24 rounded" />
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none pt-6 lg:pt-8">
              <Shimmer className="aspect-video w-full rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Batch info 4 cards */}
      <div className="mx-auto max-w-[1160px] px-[10px] py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="mt-2 h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Curriculum — Hello / Hi accordion */}
      <div className="py-3" style={{ background: 'linear-gradient(180deg, #EFFFF2 0%, #FFFFFF 100%)' }}>
        <div className="mx-auto max-w-[1140px] px-[10px]">
          <div className="text-center mb-3">
            <Shimmer className="mx-auto h-8 w-48" />
            <div className="flex items-center justify-center gap-5 mt-2">
              <Shimmer className="h-5 w-20" />
              <Shimmer className="h-5 w-28" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-sm border border-gray-200 bg-white overflow-hidden">
                <Shimmer className="h-14 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools 4 cards */}
      <div className="mx-auto max-w-[1160px] px-[10px] py-6">
        <Shimmer className="mx-auto h-6 w-64 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
              <Shimmer className="h-10 w-10 rounded-lg" />
              <Shimmer className="mt-3 h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
