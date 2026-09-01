"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { cartApiBrowser as cartApi } from "@/features/cart/api/browser";
import type { CartItem } from "@/features/cart/api";
import { trackRemoveFromCart, trackViewCart } from "@/shared/utils/dataLayer";

interface CartPageClientProps {
  initialItems: CartItem[];
}

export function CartPageClient({ initialItems }: CartPageClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  // GTM dataLayer — view_cart, fired once when the cart page mounts with items.
  useEffect(() => {
    if (initialItems.length === 0) return;
    trackViewCart(
      initialItems.map((item) => ({
        item_id: String(item.courseId),
        item_name: item.courseTitle,
        price: item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const p = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
    return sum + p;
  }, 0);
  const total = subtotal;

  function handleRemove(courseId: number) {
    const item = items.find((i) => i.courseId === courseId);
    startTransition(async () => {
      await cartApi.removeFromCart(courseId).catch(() => null);
      setItems((prev) => prev.filter((i) => i.courseId !== courseId));
      if (item) {
        const price = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
        trackRemoveFromCart({ item_id: String(item.courseId), item_name: item.courseTitle, price });
      }
    });
  }

  function handleCheckout() {
    if (items.length === 0) return;
    const courseIds = items.map((i) => i.courseId).join(",");
    router.push(`/checkout?${new URLSearchParams({ courseIds }).toString()}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left — items */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Your cart ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-ink-soft dark:text-gray-400">Your cart is currently empty.</p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <span>Item</span>
                <span className="w-24 text-center">Price</span>
                <span className="w-12 text-center">Action</span>
              </div>

              {items.map((item) => {
                const price = parseFloat(item.price);
                const discountPrice = item.discountPrice
                  ? parseFloat(item.discountPrice)
                  : null;
                const effective = discountPrice ?? price;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-100 py-4 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {item.courseThumbnail ? (
                          <Image
                            src={item.courseThumbnail}
                            alt={item.courseTitle}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/20 dark:to-brand-500/10" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/courses/${item.courseSlug}`}
                          className="line-clamp-1 text-sm font-bold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                        >
                          {item.courseTitle}
                        </Link>
                        <p className="mt-1 text-xs text-gray-400 line-through dark:text-gray-500">
                          Tk {price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <span className="w-24 text-center text-sm font-bold text-gray-900 dark:text-white">
                      Tk {effective.toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.courseId)}
                      disabled={isPending}
                      aria-label="Remove"
                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Take more courses <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Right — summary */}
      <div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Your payment & order info
          </h3>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>Tk {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              <span>Total</span>
              <span className="text-brand-600 dark:text-brand-400">Tk {total.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isPending || items.length === 0}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-from to-brand-to py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-60"
          >
            {isPending ? "Processing…" : "Make payment"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
