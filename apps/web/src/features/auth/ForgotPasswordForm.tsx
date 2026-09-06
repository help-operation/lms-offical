"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { AtSign, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type Step = 1 | 2 | 3;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

export function ForgotPasswordForm({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState("");
  const [idError, setIdError] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const isEmail = identifier.includes("@");

  const handleOtpChange = useCallback((i: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setServerError("");
    if (val && i < OTP_LENGTH - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    setServerError("");
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  }, []);

  function validIdentifier() {
    const v = identifier.trim();
    if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return /^\+?[0-9]{10,15}$/.test(v.replace(/[\s-]/g, ""));
  }

  async function sendOtp() {
    if (!validIdentifier()) {
      setIdError("Enter a valid email or phone number");
      return;
    }
    setIdError("");
    setSending(true);
    try {
      await apiRequestBrowser<null>("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), purpose: "reset" }),
      });
      setStep(2);
      setTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setIdError(err?.message ?? "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }

  async function resendOtp() {
    if (timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setServerError("");
    setSending(true);
    try {
      await apiRequestBrowser<null>("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), purpose: "reset" }),
      });
      setTimer(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setServerError(err?.message ?? "Failed to resend OTP");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || !/^[0-9]{4}$/.test(code)) {
      setServerError("Enter the 4-digit OTP");
      return;
    }
    if (password.length < 6) {
      setServerError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setServerError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequestBrowser<null>("/auth/account/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), code, password }),
      });
      if (onSuccess) {
        onSuccess();
        return;
      }
      setStep(3);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setServerError(err?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 3) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          Password reset successful
        </h2>
        <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">Redirecting you to sign in...</p>
      </div>
    );
  }

  const timerProgress = timer > 0 ? timer / RESEND_SECONDS : 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
              Email or phone number
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setIdError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendOtp();
                  }
                }}
                placeholder="you@example.com or 01XXXXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {idError && <p className="text-xs text-red-500 mt-1 dark:text-red-400">{idError}</p>}
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-from to-brand-to hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold transition-all"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          {/* Back + summary */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
              OTP sent to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{identifier}</span>
            </p>
          </div>

          {/* OTP digit boxes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
              Enter verification code
            </label>
            <div className="flex items-center justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  className={`h-14 w-14 rounded-xl border-2 bg-gray-50/70 text-center text-xl font-bold transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900 ${
                    serverError && serverError.includes("OTP")
                      ? "border-red-300 focus:border-red-400 dark:border-red-500/40"
                      : digit
                        ? "border-brand-300 dark:border-brand-500/50"
                        : "border-gray-200 dark:border-gray-700"
                  }`}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Timer bar */}
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand-400 transition-all duration-1000 ease-linear"
              style={{ width: `${timerProgress * 100}%` }}
            />
          </div>

          {/* Resend */}
          <div className="text-center">
            <button
              type="button"
              onClick={resendOtp}
              disabled={timer > 0 || sending}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400 dark:hover:text-brand-300 dark:disabled:text-gray-600"
            >
              {timer > 0 ? (
                <span>
                  Resend OTP in{" "}
                  <span className="font-bold tabular-nums">{timer}s</span>
                </span>
              ) : sending ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                </span>
              ) : (
                "Resend OTP"
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-300">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {serverError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-from to-brand-to hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </>
      )}
    </form>
  );
}
