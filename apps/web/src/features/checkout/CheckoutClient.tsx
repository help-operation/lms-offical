"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, BookOpen, ExternalLink, MessageCircle, Tag } from "lucide-react";
import { ordersApiBrowser as ordersApi } from "@/features/payments/api/orders/browser";
import {
  createLeadAction,
  initiateLeadPaymentAction,
  captureAbandonedCheckoutAction,
  captureCheckoutVisitAction,
} from "@/features/leads/actions/leads.actions";
import { trackBeginCheckout, trackPurchase, trackAddPaymentInfo } from "@/shared/utils/dataLayer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Guest name/email/phone survive the full-page redirect to the payment
// gateway and back via sessionStorage, so "Try again" after a failed payment
// lands the guest back on checkout with their details still filled in.
const GUEST_INFO_KEY = "skillkoro:checkout-guest-info";

function loadStoredGuestInfo(): { name: string; email: string; phone: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GUEST_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface CheckoutCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
}

interface CheckoutClientProps {
  courses: CheckoutCourse[];
  couponCode?: string;
  initialDiscount: number;
  /** When false, the "Your Information" form is shown and submission creates a lead instead of an order. */
  isLoggedIn: boolean;
  checkoutImageUrl?: string | null;
}

type CheckoutStep = "review" | "redirecting" | "success" | "lead-captured";

// Payment method picker removed — PayStation is an aggregator that lets the
// user pick their real method (bKash / Nagad / Rocket / SSLCommerz / cards)
// inside its hosted page. The real method is captured by the callback into
// leads.paymentMethod / payments.paystationMethod.

export function CheckoutClient({
  courses,
  couponCode,
  initialDiscount,
  isLoggedIn,
  checkoutImageUrl,
}: CheckoutClientProps) {
  const [step, setStep] = useState<CheckoutStep>("review");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(couponCode ?? "");
  const [discount, setDiscount] = useState(initialDiscount);
  const [couponError, setCouponError] = useState("");
  const [couponPending, startCouponTransition] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Guest info (only used when !isLoggedIn) — restored from sessionStorage if
  // the guest is returning here after a failed payment attempt.
  const [guest, setGuest] = useState(
    () => loadStoredGuestInfo() ?? { name: "", email: "", phone: "" },
  );
  const [guestErrors, setGuestErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Prevent firing the abandonment capture more than once per page load
  const abandonmentSentRef = useRef(false);

  // When the user hits browser Back from the payment gateway or the failed page,
  // the browser restores this page from bfcache with step still "redirecting".
  // Detect that restore and reset so they see the normal checkout form.
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setStep("review");
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // System 1 — Guest form abandonment: silently capture after the guest has
  // filled all 3 fields and paused for 1.5 s without clicking Complete Payment.
  useEffect(() => {
    if (isLoggedIn || abandonmentSentRef.current) return;
    const { name, email, phone } = guest;
    if (
      name.trim().length < 2 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
      phone.trim().length < 7
    ) return;

    const timer = setTimeout(() => {
      if (abandonmentSentRef.current) return;
      abandonmentSentRef.current = true;
      captureAbandonedCheckoutAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        courseIds: courses.map((c) => c.id),
        subtotal,
        discountAmount: discount,
        finalAmount: total,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [guest.name, guest.email, guest.phone, isLoggedIn]);

  // System 2 — Logged-in checkout visit: fire once on mount when there are
  // courses in the cart so admin can see high-intent sessions that didn't pay.
  useEffect(() => {
    if (!isLoggedIn || courses.length === 0) return;
    captureCheckoutVisitAction(courses.map((c) => c.id));
  }, []);

  // GTM dataLayer — begin_checkout, fired once when the review step mounts.
  useEffect(() => {
    if (courses.length === 0) return;
    const items = courses.map((c) => ({
      item_id: String(c.id),
      item_name: c.title,
      price: c.discountPrice ?? c.price,
    }));
    const value = items.reduce((sum, i) => sum + i.price, 0) - initialDiscount;
    trackBeginCheckout(items, Math.max(0, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = courses.reduce((sum, c) => sum + (c.discountPrice ?? c.price), 0);
  const total = Math.max(0, subtotal - discount);
  const isFree = total === 0;

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError("");
    startCouponTransition(async () => {
      try {
        const res = await ordersApi.validateCoupon(couponInput.trim(), courses.map((c) => c.id));
        setAppliedCoupon(couponInput.trim());
        setDiscount(res.data.discountAmount);
      } catch {
        setCouponError("Invalid coupon code");
      }
    });
  }

  // ── Guest lead captured ───────────────────────────────────────────────────
  if (step === "lead-captured") {
    return (
      <div className="mx-auto max-w-[980px] rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center shadow-xl" style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF] dark:bg-[#7E1FD1]/20">
          <MessageCircle className="h-10 w-10 text-[#A436F1]" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E] dark:text-white">Thanks — we&rsquo;ve got your details</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Our support team will contact you on <span className="font-semibold text-[#1A1A2E] dark:text-white">{guest.phone}</span>{" "}
          within 24 hours to confirm your enrollment and process the payment.
        </p>
        {leadId !== null && (
          <p className="mt-4 inline-block rounded-full border border-[#E9E5F2] dark:border-gray-600 px-4 py-1 text-xs font-mono text-gray-500 dark:text-gray-400">
            Ref #{leadId}
          </p>
        )}
        <div className="mt-6">
          <a
            href="/courses"
            className="inline-flex rounded-md bg-[#A436F1] px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-[#9220E0]"
          >
            Browse more courses
          </a>
        </div>
      </div>
    );
  }

  // ── Success (logged-in enrolment / free course) ──────────────────────────
  if (step === "success") {
    return (
      <div className="mx-auto max-w-[980px] rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center shadow-xl" style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF] dark:bg-[#7E1FD1]/20">
          <CheckCircle2 className="h-10 w-10 text-[#A436F1]" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E] dark:text-white">You&rsquo;re enrolled! 🎉</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You now have access to {courses.length} course
          {courses.length !== 1 ? "s" : ""}. Start learning right away.
        </p>
        <div className="mt-6 space-y-3">
          {courses.map((c) => (
            <a
              key={c.id}
              href={`/learn/${c.slug}`}
              className="flex items-center gap-3 rounded-2xl bg-[#A436F1] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 hover:bg-[#9220E0]"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">Start: {c.title}</span>
            </a>
          ))}
        </div>
        <a
          href="/student/courses"
          className="mt-4 inline-block text-sm text-gray-400 underline hover:text-gray-600"
        >
          View all my courses →
        </a>
      </div>
    );
  }

  // ── Redirecting (to payment gateway) ──────────────────────────────────────
  if (step === "redirecting") {
    return (
      <div className="mx-auto max-w-[980px] rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center shadow-xl" style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF] dark:bg-[#7E1FD1]/20">
          <Loader2 className="h-10 w-10 animate-spin text-[#A436F1]" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#1A1A2E] dark:text-white">Redirecting to payment…</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You&rsquo;re being securely redirected. Please do not close this tab.
        </p>
        <p className="mt-4 text-xs text-gray-400">Order #{orderId}</p>
      </div>
    );
  }

  // ── Submit handler — branches on logged-in vs guest ──────────────────────
  function validateGuest(): boolean {
    const errs: typeof guestErrors = {};
    if (!guest.name.trim() || guest.name.trim().length < 2) errs.name = "Name is required";
    if (!guest.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email.trim())) errs.email = "Valid email is required";
    if (!guest.phone.trim() || guest.phone.trim().length < 7) errs.phone = "Phone is required";
    setGuestErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    setError(null);

    // Guest branch — capture lead, then redirect to PayStation. If the lead
    // capture succeeds but payment initiation fails (e.g. gateway down), we
    // still show the "we'll contact you" screen because the lead is saved.
    if (!isLoggedIn) {
      if (!validateGuest()) return;
      try {
        sessionStorage.setItem(GUEST_INFO_KEY, JSON.stringify(guest));
      } catch { /* storage unavailable — retry just won't be pre-filled */ }
      startTransition(async () => {
        const leadRes = await createLeadAction({
          name: guest.name.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim(),
          courseIds: courses.map((c) => c.id),
          couponCode: appliedCoupon || null,
          subtotal,
          discountAmount: discount,
          finalAmount: total,
          // paymentMethod intentionally omitted — the PayStation callback
          // fills it in with the real method the user actually picked.
        });
        if (!leadRes.success) {
          setError(leadRes.message ?? "Couldn't submit your details. Please try again.");
          return;
        }

        setLeadId(leadRes.data.id);

        // Free course — no payment needed, just confirm the capture
        if (isFree) {
          try { sessionStorage.removeItem(GUEST_INFO_KEY); } catch { /* noop */ }
          setStep("lead-captured");
          return;
        }

        // Paid course — redirect to PayStation hosted checkout
        trackAddPaymentInfo(
          courses.map((c) => ({ item_id: String(c.id), item_name: c.title, price: c.discountPrice ?? c.price })),
          total,
          "paystation",
        );
        setStep("redirecting");
        const callbackUrl = `${API_BASE_URL}/paystation/callback`;
        const payRes = await initiateLeadPaymentAction(leadRes.data.id, callbackUrl);
        if (payRes.success) {
          window.location.href = payRes.data.paymentUrl;
        } else {
          // Gateway initiation failed but the lead is captured — fall back
          // to the "we'll contact you" message so the user isn't stuck.
          try { sessionStorage.removeItem(GUEST_INFO_KEY); } catch { /* noop */ }
          setStep("lead-captured");
        }
      });
      return;
    }

    // Logged-in branch — existing order + payment flow
    startTransition(async () => {
      try {
        const orderRes = await ordersApi.create(
          courses.map((c) => c.id),
          appliedCoupon || undefined,
        );
        const newOrderId = orderRes.data.id;
        setOrderId(newOrderId);

        if (isFree || orderRes.data.status === "paid") {
          trackPurchase({
            transactionId: String(newOrderId),
            value: total,
            coupon: appliedCoupon || undefined,
            items: courses.map((c) => ({
              item_id: String(c.id),
              item_name: c.title,
              price: c.discountPrice ?? c.price,
            })),
          });
          setStep("success");
          return;
        }

        trackAddPaymentInfo(
          courses.map((c) => ({ item_id: String(c.id), item_name: c.title, price: c.discountPrice ?? c.price })),
          total,
          "paystation",
        );
        setStep("redirecting");
        const callbackUrl = `${API_BASE_URL}/paystation/callback`;
        const payRes = await ordersApi.initiatePaystation(newOrderId, callbackUrl);
        window.location.href = payRes.data.paymentUrl;
      } catch (err) {
        setStep("review");
        setError(err instanceof Error ? err.message : "Failed to place order");
      }
    });
  }

// ── Review ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-4 max-[760px]:py-5 max-[760px]:px-3" style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}>
      <div className="flex items-center gap-3 mb-7 max-[760px]:mb-4">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#1A1A2E] dark:text-white max-[760px]:text-[21px]">Checkout</h1>
        <span className="rounded-full bg-[#F6ECFE] dark:bg-[#7E1FD1]/20 px-3.5 py-[5px] text-[12px] font-semibold tracking-[0.02em] text-[#7E1FD1] dark:text-[#C084FC]">
          COURSE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 items-stretch">
        {/* Left column — customer details */}
        <div className="rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-5 max-[760px]:p-4 shadow-[0_1px_2px_rgba(20,10,40,0.03)]">
          <h2 className="text-[15px] font-bold text-[#1A1A2E] dark:text-white mb-4">Customer Details</h2>
          {!isLoggedIn ? (
            <div className="space-y-3">
              <GuestField label="Full Name" value={guest.name} onChange={(v) => setGuest((p) => ({ ...p, name: v }))} error={guestErrors.name} placeholder="আপনার পুরো নাম লিখুন" disabled={isPending} />
              <GuestField label="Mobile Number" type="tel" value={guest.phone} onChange={(v) => setGuest((p) => ({ ...p, phone: v }))} error={guestErrors.phone} placeholder="মোবাইল নম্বর" disabled={isPending} />
              <GuestField label="Email" type="email" value={guest.email} onChange={(v) => setGuest((p) => ({ ...p, email: v }))} error={guestErrors.email} placeholder="you@example.com" disabled={isPending} />
            </div>
          ) : (
            <p className="text-sm text-[#6B6B7B] dark:text-gray-400">You are logged in. Your details will be used from your account.</p>
          )}
        </div>

        {/* Right column — order summary */}
        <div className="rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-5 max-[760px]:p-4 shadow-[0_1px_2px_rgba(20,10,40,0.03)]">
          <h2 className="text-[15px] font-bold text-[#1A1A2E] dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-3.5">
            {courses.map((c) => (
              <div key={c.id} className="flex gap-3.5 max-[760px]:flex-wrap">
                <div className="w-[104px] h-[60px] max-[760px]:w-[84px] max-[760px]:h-[52px] shrink-0 rounded-[10px] flex items-center justify-center text-white font-bold text-[16px] overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #A436F1, #6B1FC2)" }}>
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    "SK"
                  )}
                </div>
                <div className="flex-1 min-w-0 max-[760px]:min-w-[150px]">
                  <div className="text-[13.5px] font-semibold leading-[1.45] text-[#1A1A2E] dark:text-white mb-1 max-[760px]:text-[13px]">{c.title}</div>
                  <div className="text-[11.5px] text-[#6B6B7B] dark:text-gray-400">Recorded Course</div>
                </div>
                <div className="text-right shrink-0 max-[760px]:w-full max-[760px]:text-left max-[760px]:mt-2 max-[760px]:flex max-[760px]:items-baseline max-[760px]:gap-2">
                  <div className="text-[14px] font-bold text-[#1A1A2E] dark:text-white">৳{(c.discountPrice ?? c.price).toLocaleString()}</div>
                  {c.discountPrice && c.discountPrice < c.price && (
                    <div className="text-[11.5px] text-[#B3AEC2] dark:text-gray-500 line-through">৳{c.price.toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#E9E5F2] dark:border-gray-600">
            <button
              type="button"
              onClick={() => setShowCoupon(!showCoupon)}
              className="flex items-center gap-2 text-[#A436F1] dark:text-[#C084FC] text-[13.5px] font-semibold cursor-pointer select-none"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3.24H4a1 1 0 00-1 1v5.59a2 2 0 00.59 1.41l9.59 9.59a2 2 0 002.82 0l5.59-5.59a2 2 0 000-2.83z" stroke="#A436F1" strokeWidth="1.6"/>
                <circle cx="7.5" cy="7.5" r="1.2" fill="#A436F1"/>
              </svg>
              Have a coupon code?
            </button>
            {showCoupon && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="কুপন কোড লিখুন"
                  className="flex-1 border border-[#E9E5F2] dark:border-gray-600 rounded-[10px] px-3 py-2.5 text-[13.5px] font-inherit outline-none bg-white dark:bg-gray-700 text-[#1A1A2E] dark:text-white placeholder:text-[#B3AEC2] dark:placeholder:text-gray-500 focus:border-[#A436F1]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponPending}
                  className="border-none bg-[#A436F1] text-white text-[13px] font-semibold px-[18px] rounded-[10px] cursor-pointer hover:bg-[#7E1FD1] transition-colors disabled:opacity-60"
                >
                  {couponPending ? "..." : "Apply"}
                </button>
              </div>
            )}
            {couponError && (
              <p className="mt-2 text-xs text-red-500">{couponError}</p>
            )}
          </div>

          {/* Sum lines */}
          <div className="mt-4 pt-3.5 border-t border-[#E9E5F2] dark:border-gray-600">
            <div className="flex justify-between text-[13px] text-[#6B6B7B] dark:text-gray-400 mb-2">
              <span>Subtotal</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#17A673]">
              <span>Delivery Charge</span>
              <span className="font-semibold">FREE</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mt-3.5 pt-3.5 border-t border-[#E9E5F2] dark:border-gray-600">
            <span className="text-[14px] font-bold text-[#1A1A2E] dark:text-white">Total to Pay</span>
            <span className="text-[18px] font-bold text-[#7E1FD1] dark:text-[#C084FC]">৳{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Payment Method */}
      <div className="mt-[22px] max-[760px]:mt-4 rounded-2xl border border-[#E9E5F2] dark:border-gray-700 bg-white dark:bg-gray-800 p-5 max-[760px]:p-4 shadow-[0_1px_2px_rgba(20,10,40,0.03)]">
        <h2 className="text-[15px] font-bold text-[#1A1A2E] dark:text-white mb-4">Payment Method</h2>

        {checkoutImageUrl ? (
          <div className="mt-1 flex justify-center">
            <img src={checkoutImageUrl} alt="Payment Methods" className="h-auto block rounded-[14px] max-w-[480px] w-full" />
          </div>
        ) : null}

        {/* Terms */}
        <div className="flex gap-[9px] items-center justify-center mt-[18px] pt-4 border-t border-[#E9E5F2] dark:border-gray-600 text-[12.5px] text-[#6B6B7B] dark:text-gray-400 leading-[1.6] max-[760px]:justify-start max-[760px]:text-left max-[760px]:text-[12px]">
          <input
            type="checkbox"
            id="acceptTerms"
            defaultChecked
            className="w-[17px] h-[17px] shrink-0 mt-[1px] border-[1.5px] border-[#E9E5F2] dark:border-gray-600 rounded-[5px] cursor-pointer accent-[#A436F1]"
          />
          <label htmlFor="acceptTerms" className="cursor-pointer">
            By clicking &quot;Place Order&quot;, I accept SkillKoro&apos;s{" "}
            <a href="/terms" className="text-[#7E1FD1] dark:text-[#C084FC] no-underline hover:underline">Terms &amp; Conditions</a>,{" "}
            <a href="/privacy" className="text-[#7E1FD1] dark:text-[#C084FC] no-underline hover:underline">Privacy Policy</a> &amp;{" "}
            <a href="/refund-policy" className="text-[#7E1FD1] dark:text-[#C084FC] no-underline hover:underline">Refund Policy</a>*
          </label>
        </div>

        {/* Pay button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="relative mt-[22px] mx-auto min-w-[260px] border-none text-white text-[15.5px] font-bold py-[14px] px-[120px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:px-5 max-[760px]:py-[14px] rounded-[10px] flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden transition-all duration-[180ms] ease-in-out hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_12px_28px_rgba(164,54,241,0.4)] active:translate-y-0 active:scale-[0.99] active:shadow-[0_6px_14px_rgba(164,54,241,0.3)] disabled:opacity-70"
          style={{
            background: "linear-gradient(135deg, #A436F1, #7E1FD1)",
            backgroundSize: "160% 160%",
            backgroundPosition: "0% 50%",
            boxShadow: "0 8px 20px rgba(164,54,241,0.28)",
          }}
        >
          <span className="absolute top-0 left-[-60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] transition-all duration-[600ms] ease-in-out group-hover:left-[130%]" />
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Processing…
            </>
          ) : (
            <>
              Pay ৳{total.toLocaleString()}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform duration-[180ms] hover:translate-x-[3px]">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        {/* Secure note */}
        <div className="flex items-center justify-center gap-[6px] mt-3 text-[12px] text-[#6B6B7B] dark:text-gray-400 max-[760px]:text-[11px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.6"/>
          </svg>
          100% Secure Payment via PayStation
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GuestField({
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
    <div className="mb-3 last:mb-0">
      <label className="block text-[11px] font-normal text-[#6B6B7B] dark:text-gray-400 tracking-[0.03em] uppercase mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded-[9px] px-3 py-2.5 text-[14px] font-inherit text-[#1A1A2E] dark:text-white outline-none transition-all duration-150 disabled:opacity-60 placeholder:text-[#B3AEC2] dark:placeholder:text-gray-500 ${
          error
            ? "border-red-300 bg-[#FCFBFE] dark:bg-gray-700 focus:border-red-400"
            : "border-[#E9E5F2] dark:border-gray-600 bg-[#FCFBFE] dark:bg-gray-700 focus:border-[#A436F1] focus:shadow-[0_0_0_3px_#F6ECFE]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
