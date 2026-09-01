import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { ShopProduct, ShopOrder } from "./index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Cart (uses API endpoints, sessionId for guest) ──────────────────────────

export interface ShopCartItem {
  id: number;
  quantity: number;
  addedAt: string;
  product: Pick<ShopProduct, "id" | "title" | "slug" | "type" | "price" | "discountPrice" | "images" | "stock" | "isActive">;
}

export const shopCartBrowser = {
  getCart: (sessionId?: string) =>
    apiRequestBrowser<ShopCartItem[]>(`/shop/cart${sessionId ? `?sessionId=${sessionId}` : ""}`),

  addToCart: (productId: number, quantity = 1, sessionId?: string) =>
    apiRequestBrowser<ShopCartItem[]>(
      `/shop/cart${sessionId ? `?sessionId=${sessionId}` : ""}`,
      { method: "POST", body: JSON.stringify({ productId, quantity }) }
    ),

  updateQuantity: (cartItemId: number, quantity: number, sessionId?: string) =>
    apiRequestBrowser<ShopCartItem[]>(
      `/shop/cart/${cartItemId}${sessionId ? `?sessionId=${sessionId}` : ""}`,
      { method: "PATCH", body: JSON.stringify({ quantity }) }
    ),

  removeFromCart: (cartItemId: number, sessionId?: string) =>
    apiRequestBrowser<ShopCartItem[]>(
      `/shop/cart/${cartItemId}${sessionId ? `?sessionId=${sessionId}` : ""}`,
      { method: "DELETE" }
    ),

  clearCart: (sessionId?: string) =>
    apiRequestBrowser<void>(
      `/shop/cart${sessionId ? `?sessionId=${sessionId}` : ""}`,
      { method: "DELETE" }
    ),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const shopOrdersBrowser = {
  createOrder: (body: {
    productIds: { productId: number; quantity: number }[];
    name: string;
    email: string;
    phone: string;
    address?: string;
    couponCode?: string;
    sessionId?: string;
  }) =>
    apiRequestBrowser<{ order: ShopOrder }>("/shop/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  validateCoupon: (code: string, subtotal: number) =>
    apiRequestBrowser<{ coupon: { type: string; value: string }; discountAmount: number }>(
      "/shop/orders/validate-coupon",
      { method: "POST", body: JSON.stringify({ code, subtotal }) }
    ),

  initiatePaystation: (orderId: number, callbackUrl: string, phone: string) =>
    apiRequestBrowser<{ paymentUrl: string; invoiceNumber: string }>(
      `/shop/orders/${orderId}/pay/paystation`,
      { method: "POST", body: JSON.stringify({ callbackUrl, phone }) }
    ),

  confirmBkash: (orderId: number, bkashTrxId: string, phone: string) =>
    apiRequestBrowser<{ orderId: number; status: string }>(
      `/shop/orders/${orderId}/pay/bkash`,
      { method: "POST", body: JSON.stringify({ bkashTrxId, phone }) }
    ),
};
