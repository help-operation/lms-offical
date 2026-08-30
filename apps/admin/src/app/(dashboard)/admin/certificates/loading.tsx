export default function CertificatesLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-16 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-11 rounded-xl bg-gray-100 dark:bg-slate-800" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="h-12 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-slate-800">
            <div className="h-4 w-6 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="h-3.5 w-36 rounded bg-gray-100 dark:bg-slate-800 ml-4" />
            <div className="h-6 w-32 rounded-lg bg-gray-100 dark:bg-slate-800 ml-auto mr-16" />
            <div className="h-3.5 w-20 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-7 w-16 rounded-lg bg-gray-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
