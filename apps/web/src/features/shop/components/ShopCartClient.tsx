"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { shopCartBrowser, type ShopCartItem } from "@/features/shop/api/browser";
import { getOrCreateSessionId } from "@/features/shop/lib/session";

export function ShopCartClient() {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    shopCartBrowser.getCart(sessionId)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const updateQty = async (itemId: number, qty: number) => {
    setUpdating(itemId);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await shopCartBrowser.updateQuantity(itemId, qty, sessionId);
      setItems(res.data ?? []);
    } catch {}
    setUpdating(null);
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await shopCartBrowser.removeFromCart(itemId, sessionId);
      setItems(res.data ?? []);
    } catch {}
    setUpdating(null);
  };

  const subtotal = items.reduce((s, i) => {
    const p = parseFloat(i.product.discountPrice ?? i.product.price);
    return s + p * i.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingBag size={24} className="text-brand-600" /> Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Browse our shop and add products to your cart.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => {
                const price = parseFloat(item.product.discountPrice ?? item.product.price);
                const hasDiscount = item.product.discountPrice !== null && parseFloat(item.product.discountPrice) < parseFloat(item.product.price);

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      {item.product.images?.[0] ? (
                        <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package size={24} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.product.slug}`} className="font-semibold text-gray-900 text-sm hover:text-brand-600 line-clamp-2">
                        {item.product.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-brand-700 font-bold text-sm">৳{price.toLocaleString("bn-BD")}</span>
                        {hasDiscount && (
                          <span className="text-gray-400 text-xs line-through">৳{parseFloat(item.product.price).toLocaleString("bn-BD")}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            disabled={updating === item.id}
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 py-1 text-sm font-semibold">{item.quantity}</span>
                          <button
                            disabled={updating === item.id || (item.product.stock !== null && item.quantity >= item.product.stock)}
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800">
                            ৳{(price * item.quantity).toLocaleString("bn-BD")}
                          </span>
                          <button
                            disabled={updating === item.id}
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
                <h2 className="font-bold text-gray-900 text-base mb-4">Order Summary</h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>৳{subtotal.toLocaleString("bn-BD")}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 mb-5">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-brand-700">৳{subtotal.toLocaleString("bn-BD")}</span>
                  </div>
                </div>

                <Link
                  href="/shop/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
                >
                  Checkout <ArrowRight size={16} />
                </Link>

                <Link href="/shop" className="block text-center text-sm text-gray-500 hover:text-brand-600 mt-3">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
