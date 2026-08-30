import type { ReactNode } from "react";
import { Suspense } from "react";
import PublicHeader from "@/shared/layout/Header/PublicHeader";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}
