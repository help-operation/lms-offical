import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";
import Link from "next/link";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center bg-white py-16 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-md rounded-3xl bg-gray-50 p-8 sm:p-10 shadow-sm dark:bg-gray-800">
          <h1 className="text-center text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Forgot password?
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft dark:text-gray-400">
            Enter your email or phone number to get an OTP.
          </p>

          <div className="mt-8">
            <ForgotPasswordForm />
          </div>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Remember your password?</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
