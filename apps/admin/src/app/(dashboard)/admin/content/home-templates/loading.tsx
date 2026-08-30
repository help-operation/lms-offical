import { Skeleton } from "@repo/ui/skeleton";

function TemplateCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="relative flex h-56 flex-col justify-center gap-1.5 bg-gray-50 p-3 dark:bg-slate-950/40">
        <div className="absolute left-3 top-2.5 flex items-center gap-1.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full shrink-0" />
        <Skeleton className="h-5 w-full shrink-0" />
        <Skeleton className="h-8 w-full shrink-0" />
        <Skeleton className="h-10 w-full shrink-0" />
        <Skeleton className="h-8 w-full shrink-0" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-1 h-14 w-full rounded-xl" />
        <div className="mt-auto flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function HomeTemplatesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <TemplateCardSkeleton />
        <TemplateCardSkeleton />
        <TemplateCardSkeleton />
        <TemplateCardSkeleton />
      </div>
    </div>
  );
}
