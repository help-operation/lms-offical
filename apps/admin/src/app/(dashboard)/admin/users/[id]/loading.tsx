export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-36 animate-pulse" />
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-md h-64 animate-pulse" />
    </div>
  );
}
