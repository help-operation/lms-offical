export default function Loading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-96 animate-pulse" />
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-96 animate-pulse" />
      </div>
    </div>
  );
}
