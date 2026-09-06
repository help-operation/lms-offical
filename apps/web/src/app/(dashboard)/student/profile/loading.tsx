export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );
}
