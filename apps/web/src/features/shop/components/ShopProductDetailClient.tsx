"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ChevronLeft, Package, Zap, Plus, Minus } from "lucide-react";
import { shopCartBrowser } from "@/features/shop/api/browser";
import type { ShopProduct } from "@/features/shop/api";
import { getOrCreateSessionId } from "@/features/shop/lib/session";

interface Props {
  product: ShopProduct;
}

export function ShopProductDetailClient({ product }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const price = parseFloat(product.discountPrice ?? product.price);
  const hasDiscount = product.discountPrice !== null && parseFloat(product.discountPrice) < parseFloat(product.price);
  const outOfStock = product.stock !== null && product.stock === 0;
  const maxQty = product.stock ?? 99;

  const handleAddToCart = useCallback(async () => {
    setAdding(true);
    try {
      const sessionId = getOrCreateSessionId();
      await shopCartBrowser.addToCart(product.id, qty, sessionId);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2500);
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }, [product.id, qty]);

  const handleBuyNow = useCallback(async () => {
    setAdding(true);
    try {
      const sessionId = getOrCreateSessionId();
      await shopCartBrowser.addToCart(product.id, qty, sessionId);
      router.push("/shop/cart");
    } catch {
      router.push(`/shop/checkout?productId=${product.id}&qty=${qty}`);
    } finally {
      setAdding(false);
    }
  }, [product.id, qty, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image gallery */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative mb-3">
                {product.images[selectedImage] ? (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package size={64} className="text-gray-300" />
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? "border-brand-500" : "border-gray-200"
                      }`}
                    >
                      <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-6 flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 w-fit px-2 py-0.5 rounded-full mb-2">
                {product.type}
              </span>

              <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{product.title}</h1>

              {product.shortDescription && (
                <p className="text-gray-600 text-sm mb-4">{product.shortDescription}</p>
              )}

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-brand-700">
                  ৳{price.toLocaleString("bn-BD")}
                </span>
                {hasDiscount && (
                  <span className="text-gray-400 text-lg line-through">
                    ৳{parseFloat(product.price).toLocaleString("bn-BD")}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {Math.round((1 - price / parseFloat(product.price)) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Quantity */}
              {!outOfStock && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {product.stock !== null && product.stock <= 10 && (
                    <span className="text-orange-500 text-xs font-medium">
                      Only {product.stock} left!
                    </span>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  disabled={outOfStock || adding}
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 rounded-xl py-3 font-semibold text-sm hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart size={18} />
                  {justAdded ? "Added to Cart ✓" : adding ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  disabled={outOfStock || adding}
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap size={18} />
                  Buy Now
                </button>
              </div>

              {outOfStock && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-red-600 font-semibold text-sm mb-4">
                  Out of Stock
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm max-w-none text-gray-700 mt-2">
                  <p className="whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
