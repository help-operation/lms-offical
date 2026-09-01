"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Tag, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { shopCartBrowser, shopOrdersBrowser, type ShopCartItem } from "@/features/shop/api/browser";
import { getOrCreateSessionId } from "@/features/shop/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Step = "info" | "redirecting";

interface GuestForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export function ShopCheckoutClient() {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<GuestForm>({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Partial<GuestForm>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isPending, startTransition] = useTransition();

  const subtotal = items.reduce((s, i) => {
    const p = parseFloat(i.product.discountPrice ?? i.product.price);
    return s + p * i.quantity;
  }, 0);
  const finalAmount = Math.max(0, subtotal - discount);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    shopCartBrowser.getCart(sessionId)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const e: Partial<GuestForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Invalid phone number";
    setErrors(e);
    setGeneralError(null);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = () => {
    if (!couponInput.trim()) return;
    startTransition(async () => {
      try {
        const res = await shopOrdersBrowser.validateCoupon(couponInput.trim(), subtotal);
        if (res.data) {
          setDiscount(res.data.discountAmount);
          setAppliedCoupon(couponInput.trim().toUpperCase());
          setCouponError("");
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setCouponError(e?.message ?? "Invalid coupon");
        setDiscount(0);
        setAppliedCoupon("");
      }
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!acceptedTerms) { setGeneralError("Please accept the terms and conditions"); return; }
    if (items.length === 0) return;

    startTransition(async () => {
      const sessionId = getOrCreateSessionId();
      try {
        const orderRes = await shopOrdersBrowser.createOrder({
          productIds: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address || undefined,
          couponCode: appliedCoupon || undefined,
          sessionId,
        });

        const orderId = orderRes.data?.order?.id;
        if (!orderId) throw new Error("Order creation failed");

        setStep("redirecting");

        const callbackUrl = `${API_BASE}/paystation/shop-callback`;
        const payRes = await shopOrdersBrowser.initiatePaystation(orderId, callbackUrl, form.phone);

        if (payRes.data?.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setGeneralError(e?.message ?? "Something went wrong. Please try again.");
        setStep("info");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <Package size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <Link href="/shop" className="text-brand-600 font-medium hover:underline mt-2">Go to Shop</Link>
      </div>
    );
  }

  if (step === "redirecting") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <Loader2 size={40} className="animate-spin text-brand-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Redirecting to payment…</h2>
        <p className="text-gray-500 text-sm mt-2">Please wait, do not close this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/shop/cart" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
          <ChevronLeft size={16} /> Back to Cart
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {generalError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <p className="text-sm text-red-700">{generalError}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Your Information</h2>
              <div className="space-y-3">
                {(["name", "email", "phone"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field} *</label>
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={field === "name" ? "Your full name" : field === "email" ? "your@email.com" : "+880..."}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${
                        errors[field] ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-brand-500"
                      }`}
                    />
                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Full address for physical delivery"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <button
                onClick={() => setShowCoupon(!showCoupon)}
                className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                <Tag size={15} /> Have a coupon code?
              </button>
              {showCoupon && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
              <div className="flex gap-2 items-start mb-4">
                <input
                  type="checkbox"
                  id="shopAcceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 border-gray-300 rounded accent-brand-600"
                />
                <label htmlFor="shopAcceptTerms" className="text-xs text-gray-500 leading-snug">
                  I accept the <a href="/terms" className="text-brand-600 hover:underline">Terms &amp; Conditions</a>, <a href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</a> &amp; <a href="/refund-policy" className="text-brand-600 hover:underline">Refund Policy</a>
                </label>
              </div>

              <button
                    onClick={applyCoupon}
                    disabled={isPending}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              {appliedCoupon && <p className="text-green-600 text-xs mt-2 font-medium">✓ Coupon "{appliedCoupon}" applied — ৳{discount.toLocaleString("bn-BD")} off</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => {
                  const p = parseFloat(item.product.discountPrice ?? item.product.price);
                  return (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium line-clamp-1">{item.product.title}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">৳{(p * item.quantity).toLocaleString("bn-BD")}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString("bn-BD")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳{discount.toLocaleString("bn-BD")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-brand-700">৳{finalAmount.toLocaleString("bn-BD")}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                {isPending ? "Processing…" : "Complete Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
