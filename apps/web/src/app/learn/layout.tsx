import { Suspense, type ReactNode } from "react";

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white text-sm text-gray-400">
          Loading lesson…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
