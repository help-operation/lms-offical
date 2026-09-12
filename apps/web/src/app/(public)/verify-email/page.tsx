import { Suspense } from "react";
import { VerifyEmailForm } from "@/features/auth/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
