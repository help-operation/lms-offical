import { Suspense, type ReactNode } from "react";
import { FooterWrapper } from "@/shared/layout/Footer/FooterWrapper";
import PublicHeader from "@/shared/layout/Header/PublicHeader";

// The /c/<id> tree lives outside the (public) route group so that the
// full-screen `learn` experience can use a bare layout. The payment-success
// page, however, is a normal public page and should keep the site chrome.
export default function LiveSuccessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <Suspense fallback={null}>{children}</Suspense>
      <Suspense fallback={null}>
        <FooterWrapper />
      </Suspense>
    </>
  );
}
