export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-6 w-64 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
    </div>
  );
}
