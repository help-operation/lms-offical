"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { consumeShopPaymentToken } from "@/features/shop/actions/shop.actions";

type Status = "loading" | "paid" | "already_paid" | "failed" | "unknown";

export function ShopSuccessClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("t");
    if (!token) {
      router.replace("/shop");
      return;
    }

    consumeShopPaymentToken(token).then((data) => {
      if (!data) {
        setStatus("unknown");
        return;
      }
      const s = data.data?.status ?? "unknown";
      setStatus(s as Status);
      if (data.data?.orderId) setOrderId(data.data.orderId);
    });
  }, [params, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const success = status === "paid" || status === "already_paid";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md w-full p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-500 text-sm mb-1">
              {status === "already_paid"
                ? "This order was already processed."
                : "Your payment was successful. Thank you!"}
            </p>
            {orderId && (
              <p className="text-gray-400 text-xs mb-6">Order #{orderId}</p>
            )}
            <div className="flex flex-col gap-3">
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              >
                <ShoppingBag size={18} /> Continue Shopping
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-brand-600"
              >
                Go to Dashboard <ArrowRight size={13} className="inline" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 text-sm mb-6">
              We could not confirm your payment. Please try again or contact support.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/shop/cart"
                className="flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              >
                Try Again
              </Link>
              <Link href="/shop" className="text-sm text-gray-500 hover:text-brand-600">
                Back to Shop
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
