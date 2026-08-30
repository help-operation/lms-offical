import { Suspense, type ReactNode } from "react";

export default function LiveLearnLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-400 dark:bg-[#0a0a0f] dark:text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600 dark:border-white/20 dark:border-t-white/70" />
            Preparing your course…
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
