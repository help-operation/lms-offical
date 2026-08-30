// Full-page skeleton shown while the course layout (auth + curriculum) is loading.
export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3 text-sm text-slate-400 dark:text-gray-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600 dark:border-white/20 dark:border-t-white/70" />
        Preparing your course…
      </div>
    </div>
  );
}
