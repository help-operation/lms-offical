"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Package, Zap } from "lucide-react";
import { shopCartBrowser } from "@/features/shop/api/browser";
import type { ShopProduct } from "@/features/shop/api";
import { getOrCreateSessionId } from "@/features/shop/lib/session";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  physical: "Physical",
  digital: "Digital",
  bundle: "Bundle",
  tool: "Tool",
};

function effectivePrice(p: ShopProduct) {
  return parseFloat(p.discountPrice ?? p.price);
}

function hasDiscount(p: ShopProduct) {
  return p.discountPrice !== null && parseFloat(p.discountPrice) < parseFloat(p.price);
}

interface ShopPageClientProps {
  products: ShopProduct[];
}

export function ShopPageClient({ products }: ShopPageClientProps) {
  const [filter, setFilter] = useState<string>("all");
  const [cartCount, setCartCount] = useState(0);
  const [adding, setAdding] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    shopCartBrowser.getCart(sessionId).then((res) => {
      const items = res.data ?? [];
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    }).catch(() => {});
  }, []);

  const handleAddToCart = useCallback(async (productId: number) => {
    setAdding(productId);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await shopCartBrowser.addToCart(productId, 1, sessionId);
      const items = res.data ?? [];
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      setAddedIds((prev) => new Set(prev).add(productId));
      setTimeout(() => setAddedIds((prev) => { const next = new Set(prev); next.delete(productId); return next; }), 2000);
    } catch {
      // ignore
    } finally {
      setAdding(null);
    }
  }, []);

  const types = ["all", ...Array.from(new Set(products.map((p) => p.type)))];
  const filtered = filter === "all" ? products : products.filter((p) => p.type === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
            <p className="text-sm text-gray-500">Premium resources for your journey</p>
          </div>
          <Link
            href="/shop/cart"
            className="relative flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Type filter pills */}
        {types.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === t
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-brand-400"
                }`}
              >
                {t === "all" ? "All Products" : PRODUCT_TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdding={adding === product.id}
                justAdded={addedIds.has(product.id)}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: ShopProduct;
  isAdding: boolean;
  justAdded: boolean;
  onAddToCart: (id: number) => void;
}

function ProductCard({ product, isAdding, justAdded, onAddToCart }: ProductCardProps) {
  const discounted = hasDiscount(product);
  const price = effectivePrice(product);
  const outOfStock = product.stock !== null && product.stock === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow relative">
      {discounted && (
        <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          SALE
        </span>
      )}

      <Link href={`/shop/${product.slug}`} className="block">
        <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={40} className="text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 hover:text-brand-600">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-brand-700 font-bold text-base">৳{price.toLocaleString("bn-BD")}</span>
          {discounted && (
            <span className="text-gray-400 text-sm line-through">
              ৳{parseFloat(product.price).toLocaleString("bn-BD")}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            disabled={outOfStock || isAdding}
            onClick={() => onAddToCart(product.id)}
            className="flex-1 flex items-center justify-center border border-gray-300 rounded-lg py-1.5 text-xs font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {justAdded ? (
              "Added ✓"
            ) : (
              <>
                <ShoppingCart size={13} className="mr-1" />
                {isAdding ? "..." : "Cart"}
              </>
            )}
          </button>
          <Link
            href={outOfStock ? "#" : `/shop/checkout?productId=${product.id}&qty=1`}
            className="flex-1 flex items-center justify-center bg-brand-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            aria-disabled={outOfStock}
          >
            <Zap size={13} className="mr-1" />
            Buy Now
          </Link>
        </div>

        {outOfStock && (
          <p className="text-red-500 text-xs text-center mt-1 font-medium">Out of Stock</p>
        )}
      </div>
    </div>
  );
}
