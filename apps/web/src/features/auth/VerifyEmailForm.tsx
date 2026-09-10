"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequestBrowser, ApiError } from "@/lib/api-client-browser";
import { CheckCircle, Mail, ArrowLeft, RotateCw } from "lucide-react";
import Link from "next/link";

const OTP_LENGTH = 4;
const RESEND_COOLDOWN = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const next = [...otp];
      next[index] = value.slice(-1);
      setOtp(next);
      setError("");
      if (value && index < OTP_LENGTH - 1) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      const next = [...otp];
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? "";
      setOtp(next);
      setError("");
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
    },
    [otp],
  );

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete 4-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiRequestBrowser("/auth/account/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/guest/dashboard"), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired OTP");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await apiRequestBrowser("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: email, purpose: "verify" }),
      });
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to resend OTP");
      } else {
        setError("Failed to resend OTP");
      }
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Email Verified!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <Mail className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Verify your email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the code sent to your email
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          We sent a 4-digit verification code to{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {email}
          </span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center justify-center gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={handleOtpPaste}
              className={`h-14 w-14 rounded-xl border-2 bg-gray-50/70 text-center text-xl font-bold transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900 ${
                error
                  ? "border-red-300 focus:border-red-400 dark:border-red-500/40"
                  : digit
                    ? "border-brand-300 dark:border-brand-500/50"
                    : "border-gray-200 dark:border-gray-700"
              }`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.join("").length !== OTP_LENGTH}
          className="mb-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="inline-flex items-center gap-1 text-sm text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <RotateCw className={`h-4 w-4 ${cooldown > 0 ? "animate-spin" : ""}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
