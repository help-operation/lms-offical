"use client";

import { useState, useEffect, useRef } from "react";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { AtSign, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";
import { trackSignUp } from "@/shared/utils/dataLayer";

type Step = 1 | 2 | 3;

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
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
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
    try {
      await apiRequestBrowser<null>("/auth/account/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      setStep(2);
      setTimer(60);
    } catch (err: any) {
      setIdError(err?.message ?? "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const code = otp.join("");
    if (code.length < 4) {
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
    // Store first/last separately under the hood (the backend keeps both for
    // certificates, invoices, emails, etc.). Split on the first space — a
    // single-word name goes entirely into firstName with an empty lastName.
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

  return (
    <form onSubmit={onSubmit}>
      {/* Step indicator — 2 dots: identifier submitted, OTP verified.
          Step 3 (name+password) is the tail end of step 2, not its own dot. */}
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
            {s < 2 && <div className={`h-0.5 w-8 flex-1 ${step > s ? "bg-brand-400" : "bg-gray-100 dark:bg-gray-700"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: identifier */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Email or phone number</label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or 01XXXXXXXXX"
                className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 pl-10 pr-4 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
              />
            </div>
            {idError && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{idError}</p>}
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
              "Continue >"
            )}
          </button>
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{identifier}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                OTP has been sent to the {isEmail ? "email" : "number"}
              </span>
            </p>
            <div className="flex gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-12 rounded-xl border border-gray-100 bg-gray-50/70 text-center text-lg font-bold transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
                />
              ))}
            </div>
            {otpError && <p className="mt-2 text-xs text-red-500">{otpError}</p>}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setTimer(60);
                  sendOtp();
                }}
                disabled={timer > 0}
                className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-900 shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-500/80 dark:text-amber-950"
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (otp.join("").length < 4) {
                setOtpError("Enter all 4 digits");
                return;
              }
              setOtpError("");
              setStep(3);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
          >
            Continue &gt;
          </button>
        </div>
      )}

      {/* Step 3: profile + password */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
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
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
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
