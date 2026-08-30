export default function ActivityLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-16 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-slate-800" />
        <div className="w-36 h-10 rounded-xl bg-gray-100 dark:bg-slate-800" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 border-b border-gray-50 dark:border-slate-800">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 w-14 rounded-full bg-gray-100 dark:bg-slate-800" />
              </div>
              <div className="h-3 w-64 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
            <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
