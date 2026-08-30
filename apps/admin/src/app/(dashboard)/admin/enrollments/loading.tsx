export default function EnrollmentsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-slate-800" />
            <div className="h-7 w-16 rounded-lg bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-28 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-10 w-36 rounded-xl bg-gray-100 dark:bg-slate-800" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-slate-800 px-5 py-3 flex gap-6">
          {["#", "Student", "Course", "Status", "Payment", "Amount", "Enrolled", "Completed"].map((h) => (
            <div key={h} className="h-3 w-14 rounded bg-gray-100 dark:bg-slate-800" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-gray-50 dark:border-slate-800">
            <div className="h-3 w-6 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-2.5 w-36 rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="h-3 w-40 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-6 w-16 rounded-lg bg-gray-100 dark:bg-slate-800" />
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
