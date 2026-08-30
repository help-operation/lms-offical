"use client";

/**
 * Global floating "Request a Callback" widget.
 *
 * Mounted once in the public layout — appears on every public page (home,
 * courses, blog, about, etc.) but NOT on `/learn/*`, `/dashboard/*`, or
 * `/(auth)/*` because those layouts don't include it.
 *
 * Three CTAs:
 *   • Submit the form    → POST /leads/callback, lead saved with source='callback_widget'
 *   • WhatsApp button    → opens wa.me deeplink in new tab
 *   • Messenger button   → opens m.me deeplink in new tab
 *
 * URLs come from NEXT_PUBLIC_WHATSAPP_URL / NEXT_PUBLIC_MESSENGER_URL env
 * vars so admin can change them without a code deploy.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Headset, X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { createCallbackLeadAction } from "@/features/leads/actions/leads.actions";
import { useScrollHidden } from "@/shared/hooks/useScrollHidden";

// Course detail pages (/courses/[slug]) show a full-width floating enroll bar
// on mobile — this widget needs to sit above it there, not just above the nav.
const COURSE_DETAIL_PATTERN = /^\/courses\/[^/]+$/;

// Official brand glyphs — lucide has no brand icons, so these are inlined.
const WhatsAppIcon = () => (
  <svg viewBox="0 0 448 512" className="h-3 w-3" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const MessengerIcon = () => (
  <svg viewBox="0 0 512 512" className="h-3 w-3" fill="currentColor">
    <path d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.59 8 256.55 8zm149.24 185.13l-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.08-43.47a15 15 0 0 0-18 0l-78.37 59.44c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.06 43.46a15 15 0 0 0 18 0l78.41-59.38c10.44-7.98 24.14 4.54 17.09 15.62z" />
  </svg>
);

const MESSENGER_URL =
  process.env.NEXT_PUBLIC_MESSENGER_URL ?? "https://m.me/SkillKoro";

interface FormState {
  name: string;
  email: string;
  phone: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "" };

export function CallbackWidget({
  whatsappUrl = "",
  navAlwaysVisible = false,
}: {
  whatsappUrl?: string;
  /** Mobile bottom nav never slides away (Elevate template) — stay above it instead of dropping down on scroll. */
  navAlwaysVisible?: boolean;
}) {
  const pathname = usePathname();
  const isCourseDetail = COURSE_DETAIL_PATTERN.test(pathname);
  const scrollHidden = useScrollHidden();
  const navHidden = navAlwaysVisible ? false : scrollHidden;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Refs let the outside-click handler ignore clicks on the popover itself
  // and on the toggle button (so the button keeps acting as a toggle).
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isPending]);

  // Close on outside click (but ignore clicks on the popover or button itself)
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (isPending) return;
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, isPending]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Name is required";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      errs.email = "Valid email is required";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 7) errs.phone = "Please enter a valid phone number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    startTransition(async () => {
      const res = await createCallbackLeadAction({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      if (res.success) {
        setSent(true);
        setForm(EMPTY);
        setErrors({});
      } else {
        setServerError(res.message ?? "Couldn't submit. Please try again.");
      }
    });
  }

  function reset() {
    setOpen(false);
    // Brief delay so closing animation doesn't flash an empty form
    setTimeout(() => {
      setSent(false);
      setForm(EMPTY);
      setErrors({});
      setServerError(null);
    }, 200);
  }

  return (
    <>
      {/* Floating button — toggle */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Request a callback"
        aria-expanded={open}
        className={`fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl ring-4 ring-brand-200/60 transition-all hover:scale-110 active:scale-95 lg:bottom-5 ${
          isCourseDetail
            ? navHidden
              ? "bottom-24"
              : "bottom-40"
            : navHidden
              ? "bottom-8"
              : "bottom-24"
        }`}
      >
        <Headset className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      </button>

      {/* Popover — anchored just above the floating button.
          Desktop: fixed 22rem wide, right-aligned. Mobile: full width with
          5px margins so it still feels anchored to the button. */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="false"
          aria-label="Request a callback"
          className={`fixed z-50 left-4 right-4 sm:left-auto sm:right-5 sm:w-[22rem] transition-[bottom] duration-300 lg:bottom-[5.5rem] ${
            isCourseDetail
              ? navHidden
                ? "bottom-[11rem]"
                : "bottom-[15rem]"
              : navHidden
                ? "bottom-[6.25rem]"
                : "bottom-[10.25rem]"
          }`}
        >
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Brand header */}
            <div className="relative bg-gradient-to-br from-brand-500 to-brand-600 px-6 pt-5 pb-7 text-white text-center">
              <button
                onClick={reset}
                disabled={isPending}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-2xl font-extrabold tracking-tight">Skillkoro</p>
              <p className="mt-4 text-sm font-semibold leading-snug">
                A counselor will call you shortly to give details.
              </p>
            </div>

            {/* Body */}
            <div className="-mt-4 rounded-t-3xl bg-white px-5 pt-5 pb-5">
              {sent ? (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    Request received
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Our team will call you within the next few hours.
                  </p>
                  <button
                    onClick={reset}
                    className="mt-5 w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                    placeholder="Enter your full name"
                    error={errors.name}
                    disabled={isPending}
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                    placeholder="example@email.com"
                    error={errors.email}
                    disabled={isPending}
                  />
                  <Field
                    label="Mobile Number"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                    placeholder="+880 1XXXXXXXXX"
                    error={errors.phone}
                    disabled={isPending}
                  />

                  {serverError && (
                    <p className="text-xs text-red-500">{serverError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        Submit <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* WhatsApp + Messenger quick CTAs */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-white">
                        <WhatsAppIcon />
                      </span>
                      Whatsapp
                    </a>
                    <a
                      href={MESSENGER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#F847B6] text-white">
                        <MessengerIcon />
                      </span>
                      Messenger
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60 ${error
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-brand-400"
          }`}
      />
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
