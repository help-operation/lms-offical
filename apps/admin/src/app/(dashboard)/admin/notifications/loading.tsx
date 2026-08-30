export default function NotificationsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-44 rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-72 rounded-lg bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
      <div className="h-14 rounded-2xl bg-brand-50 dark:bg-brand/10 border border-brand-100 dark:border-brand/20" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-32 rounded bg-gray-100 dark:bg-slate-800" />
                <div className="h-3 w-64 rounded bg-gray-100 dark:bg-slate-800" />
                <div className="h-3 w-80 rounded bg-gray-100 dark:bg-slate-800" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="h-8 w-16 rounded-xl bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
