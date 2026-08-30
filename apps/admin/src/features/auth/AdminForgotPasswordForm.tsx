"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { requestPasswordResetAction } from "@/features/auth/actions/auth.actions";

export function AdminForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setStatus("loading");
    setError(null);
    const result = await requestPasswordResetAction();
    if (!result.success) {
      setError(result.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            A password reset link has been sent to the super admin&apos;s
            registered email. Open it and click the link to continue.
          </p>
          <p className="text-xs font-medium text-amber-600">
            ⚠️ The link will expire in 15 minutes.
          </p>
        </div>
        <div className="w-full rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
          Can&apos;t find the email? Check your spam folder.
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-sm leading-relaxed text-gray-600">
          Clicking the button will send a password reset link to the super
          admin&apos;s registered email. The link will expire in{" "}
          <span className="font-semibold text-gray-900">15 minutes</span>.
        </p>
      </div>

      {status === "error" && error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {status === "loading" ? "Sending link..." : "Send reset link"}
      </button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
