"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, BookOpen, MessageCircle, Tag, X } from "lucide-react";
import { ordersApiBrowser as ordersApi } from "@/features/payments/api/orders/browser";
import {
  createLeadAction,
  initiateLeadPaymentAction,
  captureAbandonedCheckoutAction,
  captureCheckoutVisitAction,
} from "@/features/leads/actions/leads.actions";
import { trackBeginCheckout, trackPurchase, trackAddPaymentInfo } from "@/shared/utils/dataLayer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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

interface MasteryCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  courseType?: "single" | "bundle";
  bundledCourses?: Array<{ id: number; title: string; slug: string; price: string; discountPrice: string | null; thumbnail: string | null }>;
  masteryCheckoutImage?: string | null;
}

interface MasteryCheckoutSectionProps {
  course: MasteryCourse;
  isLoggedIn: boolean;
  user?: { name: string; email: string; phone: string } | null;
  isEnrolled: boolean;
  paymentButtonText?: string;
}

type CheckoutStep = "form" | "redirecting" | "success" | "lead-captured";

export function MasteryCheckoutSection({
  course,
  isLoggedIn,
  user,
  isEnrolled,
  paymentButtonText,
}: MasteryCheckoutSectionProps) {
  const [step, setStep] = useState<CheckoutStep>("form");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponPending, startCouponTransition] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [guest, setGuest] = useState(
    () => loadStoredGuestInfo() ?? { name: "", email: "", phone: "" },
  );
  const [guestErrors, setGuestErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const abandonmentSentRef = useRef(false);

  const subtotal = course.discountPrice ?? course.price;
  const total = Math.max(0, subtotal - discount);
  const isFree = total === 0;

  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setStep("form");
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (isLoggedIn || abandonmentSentRef.current) return;
    const { name, email, phone } = guest;
    if (
      name.trim().length < 2 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
      phone.trim().length < 7
    )
      return;

    const timer = setTimeout(() => {
      if (abandonmentSentRef.current) return;
      abandonmentSentRef.current = true;
      captureAbandonedCheckoutAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        courseIds: [course.id],
        subtotal,
        discountAmount: discount,
        finalAmount: total,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [guest.name, guest.email, guest.phone, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    captureCheckoutVisitAction([course.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const item = {
      item_id: String(course.id),
      item_name: course.title,
      price: course.discountPrice ?? course.price,
    };
    trackBeginCheckout(
      [item],
      Math.max(0, (course.discountPrice ?? course.price) - discount),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateGuest(): boolean {
    const errs: typeof guestErrors = {};
    if (!guest.name.trim() || guest.name.trim().length < 2)
      errs.name = "নাম প্রয়জন";
    if (
      !guest.email.trim() ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email.trim())
    )
      errs.email = "সঠিক ইমেইল প্রয়জন";
    if (!guest.phone.trim() || guest.phone.trim().length < 7)
      errs.phone = "ফোন নম্বর প্রয়জন";
    setGuestErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError("");
    startCouponTransition(async () => {
      try {
        const res = await ordersApi.validateCoupon(couponInput.trim(), [course.id]);
        setAppliedCoupon(couponInput.trim());
        setDiscount(res.data.discountAmount);
      } catch (err: any) {
        const msg = err?.message || "Could not validate coupon";
        setCouponError(msg);
      }
    });
  }

  function handleSubmit() {
    setError(null);

    if (!isLoggedIn) {
      if (!validateGuest()) return;
      try {
        sessionStorage.setItem(GUEST_INFO_KEY, JSON.stringify(guest));
      } catch {
        /* storage unavailable */
      }
      startTransition(async () => {
        const leadRes = await createLeadAction({
          name: guest.name.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim(),
          courseIds: [course.id],
          couponCode: appliedCoupon || null,
          subtotal,
          discountAmount: discount,
          finalAmount: total,
        });
        if (!leadRes.success) {
          setError(
            leadRes.message ?? "Couldn't submit your details. Please try again.",
          );
          return;
        }

        setLeadId(leadRes.data.id);

        if (isFree) {
          try {
            sessionStorage.removeItem(GUEST_INFO_KEY);
          } catch {
            /* noop */
          }
          setStep("lead-captured");
          return;
        }

        trackAddPaymentInfo(
          [
            {
              item_id: String(course.id),
              item_name: course.title,
              price: course.discountPrice ?? course.price,
            },
          ],
          total,
          "paystation",
        );
        setStep("redirecting");
        const callbackUrl = `${API_BASE_URL}/paystation/callback`;
        const payRes = await initiateLeadPaymentAction(
          leadRes.data.id,
          callbackUrl,
        );
        if (payRes.success) {
          window.location.href = payRes.data.paymentUrl;
        } else {
          try {
            sessionStorage.removeItem(GUEST_INFO_KEY);
          } catch {
            /* noop */
          }
          setStep("lead-captured");
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const orderRes = await ordersApi.create(
          [course.id],
          appliedCoupon || undefined,
        );
        const newOrderId = orderRes.data.id;
        setOrderId(newOrderId);

        if (isFree || orderRes.data.status === "paid") {
          trackPurchase({
            transactionId: String(newOrderId),
            value: total,
            coupon: appliedCoupon || undefined,
            items: [
              {
                item_id: String(course.id),
                item_name: course.title,
                price: course.discountPrice ?? course.price,
              },
            ],
          });
          setStep("success");
          return;
        }

        trackAddPaymentInfo(
          [
            {
              item_id: String(course.id),
              item_name: course.title,
              price: course.discountPrice ?? course.price,
            },
          ],
          total,
          "paystation",
        );
        setStep("redirecting");
        const callbackUrl = `${API_BASE_URL}/paystation/callback`;
        const payRes = await ordersApi.initiatePaystation(
          newOrderId,
          callbackUrl,
        );
        window.location.href = payRes.data.paymentUrl;
      } catch (err) {
        setStep("form");
        setError(err instanceof Error ? err.message : "Failed to place order");
      }
    });
  }

  if (isEnrolled) {
    return (
      <section
        id="enroll"
        className="bg-gray-50 py-14"
        style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}
      >
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="rounded-3xl border border-green-100 bg-white p-12 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">
              আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              আপনার ড্যাশবোর্ড থেকে কোর্সটি অ্যাক্সেস করুন।
            </p>
            <a
              href="/student/courses"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:bg-green-700"
            >
              আমার কোর্সে যান
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (step === "lead-captured") {
    return (
      <section
        id="enroll"
        className="bg-gray-50 py-14"
        style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}
      >
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="rounded-2xl border border-[#E9E5F2] bg-white p-10 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF]">
              <MessageCircle className="h-10 w-10 text-[#A436F1]" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
              ধন্যবাদ — আমরা আপনার তথ্য পেয়েছি
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              আমাদের সাপোর্ি টিম{" "}
              <span className="font-semibold text-[#1A1A2E]">
                {guest.phone}
              </span>{" "}
              নম্বরে তরো ঘণ্টার মধ্যে যোগাযোগ করবে।
            </p>
            {leadId !== null && (
              <p className="mt-4 inline-block rounded-full border border-[#E9E5F2] px-4 py-1 font-mono text-xs text-gray-500">
                Ref #{leadId}
              </p>
            )}
            <div className="mt-6">
              <a
                href="/courses"
                className="inline-flex rounded-md bg-[#A436F1] px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-[#9220E0]"
              >
                আরো কোর্স দেখুন
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (step === "success") {
    return (
      <section
        id="enroll"
        className="bg-gray-50 py-14"
        style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}
      >
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="rounded-2xl border border-[#E9E5F2] bg-white p-10 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF]">
              <CheckCircle2 className="h-10 w-10 text-[#A436F1]" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
              আপনি এনরোল হয়ে গেছে! 🎉
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              এখনই শেখা শুরু করুন।
            </p>
            <div className="mt-6 space-y-3">
              {course.courseType === "bundle" && course.bundledCourses && course.bundledCourses.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600">আপনি এই {course.bundledCourses.length}টি কোর্সে এনরোল হয়েছেন:</p>
                  {course.bundledCourses.map((bc) => (
                    <a
                      key={bc.id}
                      href={`/learn/${bc.slug}`}
                      className="flex items-center gap-3 rounded-2xl bg-[#A436F1] px-5 py-3 font-semibold text-white transition-opacity hover:bg-[#9220E0] hover:opacity-90"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{bc.title}</span>
                    </a>
                  ))}
                </>
              ) : (
                <a
                  href={`/learn/${course.slug}`}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-[#A436F1] px-5 py-3 font-semibold text-white transition-opacity hover:bg-[#9220E0] hover:opacity-90"
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">শুরু করুন: {course.title}</span>
                </a>
              )}
            </div>
            <a
              href="/student/courses"
              className="mt-4 inline-block text-sm text-gray-400 underline hover:text-gray-600"
            >
              সব কোর্স দেখুন →
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (step === "redirecting") {
    return (
      <section
        id="enroll"
        className="bg-gray-50 py-14"
        style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}
      >
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="rounded-2xl border border-[#E9E5F2] bg-white p-10 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF]">
              <Loader2 className="h-10 w-10 animate-spin text-[#A436F1]" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
              পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছেन।…
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              নিরাপদে রিডাইরেক্ট হচ্ছে। এই ট্যাব বন্ধ করবেন না।
            </p>
            {orderId && (
              <p className="mt-4 text-xs text-gray-400">Order #{orderId}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="enroll"
      className="bg-gray-50 py-14"
      style={{ fontFamily: "'Hind Siliguri', 'Nirmala UI', sans-serif" }}
    >
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
          কোর্স জয়েজন করতে নিচের ফর্মটি পূরণ করুন
        </h2>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E9E5F2] bg-white p-5 shadow-[0_1px_2px_rgba(20,10,40,0.03)]">
            <h2 className="mb-4 text-[15px] font-bold text-[#1A1A2E]">
              আপনার তথ্য
            </h2>
            {!isLoggedIn ? (
              <div className="space-y-3">
                <GuestField
                  label="পুরো নাম"
                  value={guest.name}
                  onChange={(v) => setGuest((p) => ({ ...p, name: v }))}
                  error={guestErrors.name}
                  placeholder="আপনার পুরো নাম লিখুন"
                  disabled={isPending}
                />
                <GuestField
                  label="মোবাইল নম্বর"
                  type="tel"
                  value={guest.phone}
                  onChange={(v) => setGuest((p) => ({ ...p, phone: v }))}
                  error={guestErrors.phone}
                  placeholder="01XXXXXXXXX"
                  disabled={isPending}
                />
                <GuestField
                  label="ইমেইল"
                  type="email"
                  value={guest.email}
                  onChange={(v) => setGuest((p) => ({ ...p, email: v }))}
                  error={guestErrors.email}
                  placeholder="you@example.com"
                  disabled={isPending}
                />
              </div>
            ) : (
              <div className="space-y-2 text-sm text-[#6B6B7B]">
                {user?.name && <p className="font-semibold text-[#1A1A2E]">{user.name}</p>}
                {user?.email && <p>{user.email}</p>}
                {user?.phone && <p>{user.phone}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E9E5F2] bg-white p-5 shadow-[0_1px_2px_rgba(20,10,40,0.03)]">
            <h2 className="mb-4 text-[15px] font-bold text-[#1A1A2E]">
              অর্ডার সারসংক্ষেপ
            </h2>
            {course.courseType === "bundle" && course.bundledCourses && course.bundledCourses.length > 0 ? (
              <div className="space-y-3.5">
                <p className="text-xs font-medium text-indigo-600">📦 বান্ডেল — {course.bundledCourses.length}টি কোর্স অন্তর্ভুক্ত</p>
                <div className="space-y-2">
                  {course.bundledCourses.map((bc) => (
                    <div key={bc.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                      {bc.thumbnail ? (
                        <img src={bc.thumbnail} alt={bc.title} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-indigo-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold leading-snug text-[#1A1A2E] line-clamp-2">{bc.title}</div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#1A1A2E]">৳{Number(bc.price).toLocaleString("en-BD")}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-indigo-50/60 px-3 py-3 space-y-1.5">
                  {course.discountPrice != null && course.discountPrice < course.price ? (
                    <>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>মোট মূল্য:</span>
                        <span className="line-through">৳{course.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          বান্ডেল ছাড়
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                            {Math.round((1 - course.discountPrice / course.price) * 100)}% OFF
                          </span>
                        </span>
                        <span className="font-semibold text-red-500">-৳{(course.price - course.discountPrice).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-indigo-100 pt-1.5">
                        <span className="text-base font-bold text-[#1A1A2E]">বান্ডেল মূল্য:</span>
                        <span className="text-xl font-bold text-[#7E1FD1]">৳{course.discountPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-medium text-green-600">আপনি ৳{(course.price - course.discountPrice).toLocaleString()} সাশ্রয় করছেন</div>
                      <div className="text-xs text-gray-400">একবার পেমেন্টে সব কোর্সে অ্যাক্সেস</div>
                    </>
                  ) : (
                    <div className="text-sm text-indigo-700">
                      বান্ডেল মূল্য: <span className="font-bold">৳{(course.discountPrice ?? course.price).toLocaleString()}</span> — একবার পেমেন্টে সব কোর্সে অ্যাক্সেস
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex gap-3.5">
                  <div
                    className="flex h-[60px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] font-bold text-[16px] text-white"
                    style={{ background: "linear-gradient(135deg, #A436F1, #6B1FC2)" }}
                  >
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[13.5px] font-semibold leading-[1.45] text-[#1A1A2E]">
                      {course.title}
                    </div>
                    <div className="text-[11.5px] text-[#6B6B7B]">Recorded Course</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[14px] font-bold text-[#1A1A2E]">৳{(course.discountPrice ?? course.price).toLocaleString()}</div>
                    {course.discountPrice && course.discountPrice < course.price && (
                      <div className="text-[11.5px] text-[#B3AEC2] line-through">৳{course.price.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3.5 border-t border-dashed border-[#E9E5F2] pt-3.5">
              <button
                type="button"
                onClick={() => setShowCoupon(!showCoupon)}
                className="flex cursor-pointer select-none items-center gap-2 text-[13.5px] font-semibold text-[#A436F1]"
              >
                <Tag className="h-4 w-4" />
                কুপন কোড আছে?
              </button>
              {appliedCoupon ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <span className="flex-1 text-sm font-medium text-green-700">✅ Coupon applied: {appliedCoupon} — ৳{discount} OFF</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon("");
                      setDiscount(0);
                      setCouponInput("");
                      setCouponError("");
                    }}
                    className="rounded-full bg-white p-1 text-green-600 hover:bg-green-100"
                    title="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                showCoupon && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="কুপন কোড লিখুন"
                      className="flex-1 rounded-[10px] border border-[#E9E5F2] bg-white px-3 py-2.5 font-inherit text-[13.5px] text-[#1A1A2E] outline-none placeholder:text-[#B3AEC2] focus:border-[#A436F1]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponPending}
                      className="rounded-[10px] border-none bg-[#A436F1] px-[18px] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#7E1FD1] disabled:opacity-60"
                    >
                      {couponPending ? "…" : "Apply"}
                    </button>
                  </div>
                )
              )}
              {couponError && (
                <p className="mt-1 text-xs text-red-500">{couponError}</p>
              )}
            </div>

            <div className="mt-4 border-t border-[#E9E5F2] pt-3.5">
              <div className="mb-2 flex justify-between text-[13px] text-[#6B6B7B]">
                <span>সাবটোটাল</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[13px] text-[#17A673]">
                  <span>ছাড়</span>
                  <span className="font-semibold">-৳{discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-[#E9E5F2] pt-3.5">
              <span className="text-[14px] font-bold text-[#1A1A2E]">
                মোট পেমেন্ট
              </span>
              <span className="text-[18px] font-bold text-[#7E1FD1]">
                ৳{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {course.masteryCheckoutImage ? (
          <div className="mt-6 flex justify-center">
            <img src={course.masteryCheckoutImage} alt="Payment Methods" className="h-auto w-full max-w-[480px] rounded-xl" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="relative mx-auto mt-6 flex min-w-[260px] items-center justify-center gap-2.5 overflow-hidden rounded-[10px] border-none px-6 sm:px-[120px] py-[14px] text-[15.5px] font-bold text-white whitespace-nowrap transition-all duration-[180ms] ease-in-out hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_12px_28px_rgba(164,54,241,0.4)] active:translate-y-0 active:scale-[0.99] active:shadow-[0_6px_14px_rgba(164,54,241,0.3)] disabled:opacity-70"
          style={{
            background: "linear-gradient(135deg, #A436F1, #7E1FD1)",
            boxShadow: "0 8px 20px rgba(164,54,241,0.28)",
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> প্রক্রিয়া হচ্ছে…
            </>
          ) : isFree ? (
            <>
              বিনামূল্যে এনরোল করুন
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-[180ms] hover:translate-x-[3px]"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          ) : (
            <>
              {paymentButtonText || `পেমেন্ট করুন ৳${total.toLocaleString()}`}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-[180ms] hover:translate-x-[3px]"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#6B6B7B]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 11V7a4 4 0 018 0v4"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
          100% নিরাপদ পেমেন্ট — PayStation
        </div>
      </div>
    </section>
  );
}

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
      <label className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.03em] text-[#6B6B7B]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-[9px] border px-3 py-2.5 font-inherit text-[14px] text-[#1A1A2E] outline-none transition-all duration-150 placeholder:text-[#B3AEC2] disabled:opacity-60 ${
          error
            ? "border-red-300 bg-[#FCFBFE] focus:border-red-400"
            : "border-[#E9E5F2] bg-[#FCFBFE] focus:border-[#A436F1] focus:shadow-[0_0_0_3px_#F6ECFE]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
