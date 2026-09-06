"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { AtSign, Lock, Eye, EyeOff, Loader2, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { trackSignUp } from "@/shared/utils/dataLayer";

type Step = 1 | 2 | 3;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

export function SignupForm({
  defaultIdentifier,
  onRegistered,
}: {
  defaultIdentifier?: string;
  onRegistered?: (identifier: string) => void;
} = {}) {
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState(defaultIdentifier ?? "");
  const [idError, setIdError] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (defaultIdentifier) setIdentifier(defaultIdentifier);
  }, [defaultIdentifier]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const isEmail = identifier.includes("@");

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
    setOtpError("");
    setOtpSuccess(false);
    try {
      await apiRequestBrowser<null>("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim() }),
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
    setOtpError("");
    setOtpSuccess(false);
    setSending(true);
    try {
      await apiRequestBrowser<null>("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      setTimer(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err?.message ?? "Failed to resend OTP");
    } finally {
      setSending(false);
    }
  }

  const handleOtpChange = useCallback((i: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setOtpError("");
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
    setOtpError("");
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  }, []);

  function goToOtp() {
    if (otp.join("").length < OTP_LENGTH) {
      setOtpError("Enter all 4 digits");
      return;
    }
    setOtpError("");
    setStep(3);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setServerError("Enter the 4-digit OTP");
      return;
    }
    if (fullName.trim().length < 2) {
      setServerError("Enter your full name");
      return;
    }
    if (password.length < 6) {
      setServerError("Password must be at least 6 characters");
      return;
    }
    const [firstName, ...rest] = fullName.trim().replace(/\s+/g, " ").split(" ");
    const lastName = rest.join(" ");
    setSubmitting(true);
    try {
      await apiRequestBrowser<null>("/auth/account/signup", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          code,
          firstName,
          lastName,
          password,
        }),
      });
      trackSignUp(isEmail ? "email" : "phone");
      onRegistered?.(identifier.trim());
    } catch (err: any) {
      setServerError(err?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const timerProgress = timer > 0 ? timer / RESEND_SECONDS : 0;

  return (
    <form onSubmit={onSubmit}>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step > s || (s === 2 && step === 3)
                  ? "bg-brand-500 text-white"
                  : step === s
                    ? "bg-gradient-to-r from-brand-from to-brand-to text-white"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              }`}
            >
              {step > s || (s === 2 && step === 3) ? "✓" : s}
            </div>
            {s < 2 && (
              <div
                className={`h-0.5 w-8 flex-1 ${
                  step > s ? "bg-brand-400" : "bg-gray-100 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ─── Step 1: identifier ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email or phone number
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 pl-10 pr-4 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
              />
            </div>
            {idError && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {idError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      )}

      {/* ─── Step 2: OTP ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Back + identifier summary */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtpError("");
                setOtpSuccess(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
              OTP sent to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {identifier}
              </span>
            </p>
          </div>

          {/* OTP digit boxes */}
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
                  otpError
                    ? "border-red-300 focus:border-red-400 dark:border-red-500/40"
                    : digit
                      ? "border-brand-300 dark:border-brand-500/50"
                      : "border-gray-200 dark:border-gray-700"
                }`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Error / success */}
          {otpError && (
            <p className="text-center text-xs text-red-500 dark:text-red-400">
              {otpError}
            </p>
          )}
          {otpSuccess && (
            <p className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> OTP verified
            </p>
          )}

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

          {/* Continue */}
          <button
            type="button"
            onClick={goToOtp}
            disabled={otp.join("").length < OTP_LENGTH}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* ─── Step 3: profile + password ─────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Back to OTP */}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 pl-9 pr-3 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 pl-10 pr-10 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
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

          {serverError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
