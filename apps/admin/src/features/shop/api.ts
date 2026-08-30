import { apiRequest } from "@/lib/api-client";
import type { ShopProduct, ShopOrder, ShopCoupon } from "./browser";

export type { ShopProduct, ShopOrder, ShopOrderItem, ShopCoupon } from "./browser";

// ─── Server-side (Next.js Server Components) ──────────────────────────────────

export const shopAdminApi = {
  getProducts: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    return apiRequest<{ data: ShopProduct[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }>(
      `/admin/shop/products?${qs}`
    );
  },
  getProduct: (id: number) => apiRequest<ShopProduct>(`/admin/shop/products/${id}`),
  getOrders: (page = 1, limit = 20) =>
    apiRequest<{ orders: ShopOrder[]; total: number; page: number; limit: number }>(
      `/admin/shop/orders?page=${page}&limit=${limit}`
    ),
  getOrder: (id: number) => apiRequest<ShopOrder>(`/admin/shop/orders/${id}`),
  getCoupons: (page = 1) =>
    apiRequest<{ coupons: ShopCoupon[]; total: number }>(`/admin/shop/coupons?page=${page}`),
};
