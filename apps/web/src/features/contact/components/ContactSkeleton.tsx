import { Skeleton } from "@repo/ui/skeleton";
import { PageHeroSkeleton } from "@/shared/components/PageHeroSkeleton";

function Shimmer({ className }: { className: string }) {
  return <Skeleton className={`skeleton-shimmer ${className}`} />;
}

/** Mirrors the contact page's layout — hero, info cards, split contact
 * form, and map embed — so nothing shifts once CMS content, the
 * general-settings phone/email, and the map URL have loaded. */
export function ContactSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <PageHeroSkeleton lines={1} />

      {/* Info cards */}
      <section className="bg-white py-12 dark:bg-gray-900 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-800 sm:p-8">
                <Shimmer className="mx-auto h-14 w-14 rounded-full" />
                <Shimmer className="mx-auto mt-4 h-5 w-32" />
                <Shimmer className="mx-auto mt-3 h-3.5 w-40" />
                <Shimmer className="mx-auto mt-2 h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form card */}
      <section className="bg-white py-8 dark:bg-gray-900 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="grid overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800 sm:rounded-3xl lg:grid-cols-2">
            <Shimmer className="h-56 w-full rounded-none sm:h-72 lg:h-auto" />
            <div className="p-6 sm:p-8 lg:p-12">
              <Shimmer className="h-7 w-56" />
              <Shimmer className="mt-2 h-4 w-72 max-w-full" />
              <div className="mt-6 flex flex-col gap-4">
                <Shimmer className="h-12 w-full rounded-lg" />
                <Shimmer className="h-12 w-full rounded-lg" />
                <Shimmer className="h-12 w-full rounded-lg" />
                <Shimmer className="h-32 w-full rounded-lg" />
                <Shimmer className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <div className="pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <Shimmer className="h-[320px] w-full rounded-2xl sm:h-[420px] sm:rounded-3xl" />
        </div>
      </div>
    </main>
  );
}
