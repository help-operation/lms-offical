"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    /** Admin-controlled per-event on/off flags, inlined into <head> by the web app's layout. */
    __dlEvents?: Record<string, boolean>;
  }
}

/**
 * Local GA4/GTM add_to_cart push — this component lives in the shared `ui`
 * package, which can't depend on the web app's dataLayer util, so the same
 * event shape (and the admin's per-event on/off flag) is inlined here to
 * stay consistent with it.
 */
function pushAddToCart(item: { item_id: string; item_name: string; price: number }) {
  if (typeof window === "undefined") return;
  if ((window.__dlEvents?.add_to_cart ?? true) === false) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "add_to_cart",
    ecommerce: { currency: "BDT", value: item.price, items: [item] },
  });
}

/**
 * Local GA4/GTM begin_checkout push, fired once the pay form mounts — mirrors
 * CheckoutClient's trackBeginCheckout on the recorded-course side, so a
 * ecommerce.value is already sitting in dataLayer when the Meta Event Setup
 * Tool (or GTM preview) inspects this page, letting "Choose value on page"
 * work here too instead of only on click-triggered events.
 */
function pushBeginCheckout(item: { item_id: string; item_name: string; price: number }) {
  if (typeof window === "undefined") return;
  if ((window.__dlEvents?.begin_checkout ?? true) === false) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "begin_checkout",
    ecommerce: { currency: "BDT", value: item.price, items: [item] },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveEnrollmentCourse {
  id?: number;
  title: string;
  slug?: string;
  price: string;
  originalPrice?: string | null;
  hero?: { bannerImage?: string };
  /** ID of the active/upcoming batch — appended as ?batchId=... on the pay redirect */
  batchId?: number | null;
  /** Whether this is a live course or a recorded-course bundle. */
  courseType?: 'live' | 'bundle';
  /** Recorded courses included in this bundle (populated by backend when courseType = 'bundle'). */
  bundledCourses?: Array<{ id: number; title: string; price: string; thumbnail: string | null }>;
  /** Whether subscription payment is enabled for this course */
  hasSubscription?: boolean;
  /** Monthly price for subscription payment */
  monthlyPrice?: string | null;
}

/** The logged-in student, used to pre-fill & hide the info form. */
export interface EnrollmentUser {
  name: string;
  email: string;
  phone: string;
}

export interface LiveEnrollmentFormProps {
  course: LiveEnrollmentCourse;
  /** Base URL used for the /live/[slug]/pay redirect, e.g. "https://skillkoro.com". Defaults to "" (relative). */
  baseUrl?: string;
  /** When true, the section is hidden — safe to pass during admin preview. */
  previewMode?: boolean;
  /**
   * Override the outermost <section> className.
   * Defaults to "py-14 bg-gray-50" so it works on both light and dark templates.
   */
  sectionClassName?: string;
  /**
   * When provided (logged-in student), the matching info fields are pre-filled
   * and hidden, and the enrollment is linked to the account. Guests pass
   * null/undefined and see the full form as before.
   */
  user?: EnrollmentUser | null;
  /**
   * True when the logged-in user already owns this course. The pay form is then
   * replaced with an "already enrolled → go to my courses" state.
   */
  enrolled?: boolean;
  /**
   * Message from a failed checkout attempt (e.g. "?error=already_enrolled"
   * on the redirect back from /c/[id]/pay). Rendered as a banner above the
   * form so guests see why nothing happened instead of a silent bounce-back.
   */
  checkoutError?: string | null;
}

type FormStep = "form" | "redirecting" | "enrolled";

function fmt(p: string | null | undefined) {
  if (!p) return null;
  return Number(p).toLocaleString("en-BD");
}

// ─── Helper: single input field ───────────────────────────────────────────────

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
      <label className="block text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors disabled:opacity-60 ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-green-400"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveEnrollmentForm({
  course,
  baseUrl = "",
  previewMode = false,
  sectionClassName,
  user,
  enrolled = false,
  checkoutError,
}: LiveEnrollmentFormProps) {
  const [step, setStep] = useState<FormStep>("form");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'one_time' | 'subscription'>('one_time');

  // Logged-in: hide each field we already know from the account. A field still
  // shows when the account is missing it (e.g. phone for email-only signups),
  // so the student can supply it before paying.
  const isLoggedIn = !!user;
  const hideName  = isLoggedIn && !!user?.name;
  const hidePhone = isLoggedIn && !!user?.phone;
  const hideEmail = isLoggedIn && !!user?.email;

  // Hide the whole "আপনার তথ্য" card for logged-in users. The only exception is
  // when the account is missing a required field (e.g. phone for an email-only
  // signup) — then we still need a minimal card to collect just that field.
  const showInfoCard = !isLoggedIn || !hideName || !hidePhone || !hideEmail;

  const price = fmt(course.price);
  const origPrice = fmt(course.originalPrice);
  const isFree = parseFloat(course.price || "0") === 0;
  const monthlyPrice = fmt(course.monthlyPrice);
  const showSubscriptionOption = false;

  // GTM dataLayer — begin_checkout, fired once when the pay form actually
  // renders (not for previews, already-enrolled students, or closed batches).
  const hasOpenBatch = !!course.batchId || course.courseType === "bundle";
  useEffect(() => {
    if (previewMode || enrolled || !hasOpenBatch || !course.id) return;
    pushBeginCheckout({
      item_id: String(course.id),
      item_name: course.title,
      price: parseFloat(course.price || "0"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, enrolled, previewMode, hasOpenBatch]);

  if (previewMode) return null;

  // Already enrolled → don't show the pay form again; send them to their courses.
  if (enrolled) {
    return (
      <section id="enroll" className={sectionClassName ?? "py-14 bg-gray-50"}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="rounded-3xl border border-green-100 bg-white p-12 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl">
              ✅
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">
              আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন
            </h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              আপনার ড্যাশবোর্ড থেকে কোর্সটি অ্যাক্সেস করুন।
            </p>
            <a
              href={`${baseUrl}/student/courses`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 hover:scale-[1.01]"
            >
              আমার কোর্সে যান
            </a>
          </div>
        </div>
      </section>
    );
  }

  // No active or upcoming batch → enrollment is closed
  // Bundles have no batch — they are always open for purchase
  if (!course.batchId && course.courseType !== 'bundle') {
    return (
      <section id="enroll" className={sectionClassName ?? "py-14 bg-gray-50"}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
              🗓️
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">
              এখন ভর্তি চলছে না
            </h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              এই কোর্সের পরবর্তী ব্যাচ শীঘ্রই শুরু হবে।<br />
              আমাদের সাথে থাকুন — ব্যাচ শুরু হলে এনরোল করার সুযোগ পাবেন।
            </p>
          </div>
        </div>
      </section>
    );
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "নাম প্রয়োজন";
    if (!phone.trim() || phone.trim().length < 7) errs.phone = "ফোন নম্বর প্রয়োজন";
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      errs.email = "সঠিক ইমেইল প্রয়োজন";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course.id || !course.slug) return;
    if (!validate()) return;

    pushAddToCart({
      item_id: String(course.id),
      item_name: course.title,
      price: parseFloat(course.price || "0"),
    });

    setLoading(true);
    setStep("redirecting");
    try {
      const params = new URLSearchParams({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      if (course.batchId) params.set("batchId", String(course.batchId));
      if (showSubscriptionOption) params.set("paymentMode", paymentMode);

      if (isFree) {
        window.location.href = `${baseUrl}/c/${course.id}/enroll-free?${params.toString()}`;
      } else {
        window.location.href = `${baseUrl}/c/${course.id}/pay?${params.toString()}`;
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Redirecting / processing state ─────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <section className={sectionClassName ?? "py-14 bg-gray-50"}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="rounded-3xl border border-green-100 bg-white p-10 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              {isFree ? "এনরোল হচ্ছে…" : "পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছে…"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isFree
                ? "আপনার এনরোলমেন্ট প্রক্রিয়া করা হচ্ছে। এই ট্যাব বন্ধ করবেন না।"
                : "নিরাপদে রিডাইরেক্ট হচ্ছে। এই ট্যাব বন্ধ করবেন না।"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <section id="enroll" className={sectionClassName ?? "py-14 bg-gray-50"}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-8">
          কোর্স জয়েন করতে নিচের ফর্মটি পূরণ করুন
        </h2>

        {checkoutError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {checkoutError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={`grid gap-8 ${showInfoCard ? "lg:grid-cols-2" : "max-w-lg mx-auto"}`}>

            {/* ── Left: Your Information (hidden for logged-in users) ──────── */}
            {showInfoCard && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-gray-900">আপনার তথ্য</h3>

              {isLoggedIn ? (
                <div className="mt-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                  <p className="text-xs font-semibold text-green-700">
                    ✓ লগইন করা আছে — বাকি তথ্যটি দিন
                  </p>
                  <div className="mt-2 space-y-0.5 text-sm text-gray-700">
                    {user?.name && <p className="font-semibold">{user.name}</p>}
                    {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
                    {user?.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  এই তথ্য দিয়ে আপনার ভর্তি নিশ্চিত করা হবে।
                </p>
              )}

              {/* Render only the fields we don't already have. */}
              {(!hideName || !hidePhone || !hideEmail) && (
                <div className="mt-5 space-y-4">
                  {!hideName && (
                    <Field
                      label="আপনার নাম"
                      value={name}
                      onChange={setName}
                      placeholder="যেমন: রফিক হোসেন"
                      error={errors.name}
                      disabled={loading}
                    />
                  )}
                  {!hidePhone && (
                    <Field
                      label="ফোন নম্বর"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      placeholder="01XXXXXXXXX"
                      error={errors.phone}
                      disabled={loading}
                    />
                  )}
                  {!hideEmail && (
                    <Field
                      label="ইমেইল"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="your@email.com"
                      error={errors.email}
                      disabled={loading}
                    />
                  )}
                </div>
              )}
            </div>
            )}

            {/* ── Right: Order review ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-gray-900">অর্ডার সারসংক্ষেপ</h3>

              {course.courseType === 'bundle' && course.bundledCourses && course.bundledCourses.length > 0 ? (
                /* ── Bundle order summary ─────────────────────────────────── */
                <>
                  <p className="mt-2 text-xs text-indigo-600 font-medium">📦 বান্ডেল — {course.bundledCourses.length}টি কোর্স অন্তর্ভুক্ত</p>
                  <div className="mt-4 space-y-2">
                    {course.bundledCourses.map((bc) => (
                      <div key={bc.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                        {bc.thumbnail ? (
                          <img src={bc.thumbnail} alt={bc.title} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg">📚</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{bc.title}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-600 shrink-0">৳{Number(bc.price).toLocaleString('en-BD')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                    {origPrice && (
                      <div className="flex justify-between text-gray-500">
                        <span>আসল মোট মূল্য</span>
                        <span className="line-through">৳{origPrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-700">
                      <span>বান্ডেল মূল্য</span>
                      <span className="font-semibold">{isFree ? "বিনামূল্যে" : `৳${price}`}</span>
                    </div>
                    {origPrice && price && !isFree && (
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>আপনি সাশ্রয় করছেন</span>
                        <span className="font-semibold">৳{(Number(origPrice.replace(/,/g, '')) - Number(price.replace(/,/g, ''))).toLocaleString('en-BD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                      <span>মোট পেমেন্ট:</span>
                      <span className="text-green-600">{isFree ? "৳০" : `৳${price}`}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* ── Single course order summary ──────────────────────────── */
                <>
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    {course.hero?.bannerImage ? (
                      <img
                        src={course.hero.bannerImage}
                        alt={course.title}
                        className="h-12 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xl">
                        📚
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">
                        {course.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {isFree ? (
                          <span className="text-sm font-bold text-green-600">বিনামূল্যে</span>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-gray-900">৳{price}</span>
                            {origPrice && (
                              <span className="text-xs text-gray-400 line-through">৳{origPrice}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>কোর্স মূল্য</span>
                      <span className="font-semibold">
                        {isFree ? "বিনামূল্যে" : paymentMode === 'subscription' && monthlyPrice ? `৳${monthlyPrice}/মাস` : `৳${price}`}
                      </span>
                    </div>
                    {paymentMode === 'subscription' && monthlyPrice && !isFree && (
                      <div className="flex justify-between text-blue-600 text-xs">
                        <span>বার্ষিক মোট</span>
                        <span className="font-semibold">৳{(Number(monthlyPrice.replace(/,/g, '')) * 12).toLocaleString('en-BD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                      <span>মোট পেমেন্ট:</span>
                      <span className="text-green-600">
                        {isFree ? "৳০" : paymentMode === 'subscription' && monthlyPrice ? `৳${monthlyPrice}/মাস` : `৳${price}`}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Payment mode toggle (subscription available) */}
              {showSubscriptionOption && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">পেমেন্ট মোড নির্বাচন করুন:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('one_time')}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMode === 'one_time'
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-4 w-4 rounded-full border-2 ${
                          paymentMode === 'one_time' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {paymentMode === 'one_time' && (
                            <div className="h-full w-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">এককালীন পেমেন্ট</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">৳{price}</p>
                      <p className="text-xs text-gray-500 mt-1">একবারে পুরো বছরের ফি পেমেন্ট করুন</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('subscription')}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        paymentMode === 'subscription'
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-4 w-4 rounded-full border-2 ${
                          paymentMode === 'subscription' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {paymentMode === 'subscription' && (
                            <div className="h-full w-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">মাসিক সাবস্ক্রিপশন</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">৳{monthlyPrice}/মাস</p>
                      <p className="text-xs text-gray-500 mt-1">প্রতি মাসে অটো পেমেন্ট হবে</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Payment method info */}
              {isFree ? (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
                  <p className="font-semibold text-blue-700 mb-1">🎉 এই কোর্সটি সম্পূর্ণ বিনামূল্যে</p>
                  <p className="text-blue-600">কোনো পেমেন্ট ছাড়াই এখনই এনরোল করুন।</p>
                </div>
              ) : paymentMode === 'subscription' ? (
                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs">
                  <p className="font-semibold text-purple-700 mb-1">🔄 বিকাশ সাবস্ক্রিপশন পেমেন্ট</p>
                  <p className="text-purple-600">
                    বিকাশ এগ্রিমেন্টের মাধ্যমে মাসিক অটো পেমেন্ট সেটআপ করা হবে
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs">
                  <p className="font-semibold text-green-700 mb-1">💳 PayStation পেমেন্ট গেটওয়ে</p>
                  <p className="text-green-600">
                    বিকাশ, নগদ, রকেট, কার্ড সহ সকল পদ্ধতিতে পেমেন্ট করুন
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isFree ? "এনরোল হচ্ছে..." : "রিডাইরেক্ট হচ্ছে..."}
                  </>
                ) : isFree ? (
                  <>✅ বিনামূল্যে এনরোল করুন</>
                ) : paymentMode === 'subscription' ? (
                  <>
                    🔄 সাবস্ক্রিপশন শুরু করুন
                    <ExternalLink className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    🔒 পেমেন্ট করুন
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                আপনার ব্যক্তিগত তথ্য শুধুমাত্র অর্ডার প্রক্রিয়ার জন্য ব্যবহার করা হবে।
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
