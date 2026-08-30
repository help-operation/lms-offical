import { apiRequestBrowser } from "@/lib/api-client-browser";

export interface ShopProduct {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  type: "physical" | "digital" | "bundle" | "tool";
  price: string;
  discountPrice: string | null;
  images: string[];
  stock: number | null;
  downloadUrl: string | null;
  courseId: number | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrder {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  status: "pending" | "paid" | "cancelled";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string | null;
  paystationMethod: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  title: string;
}

export interface ShopCoupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export const shopAdminBrowser = {
  createProduct: (dto: Omit<ShopProduct, "id" | "createdAt" | "updatedAt">) =>
    apiRequestBrowser<ShopProduct>("/admin/shop/products", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateProduct: (id: number, dto: Partial<ShopProduct>) =>
    apiRequestBrowser<ShopProduct>(`/admin/shop/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteProduct: (id: number) =>
    apiRequestBrowser<{ id: number }>(`/admin/shop/products/${id}`, { method: "DELETE" }),

  toggleProduct: (id: number) =>
    apiRequestBrowser<ShopProduct>(`/admin/shop/products/${id}/toggle`, { method: "POST" }),

  updateFulfillment: (
    orderId: number,
    fulfillmentStatus: ShopOrder["fulfillmentStatus"],
    notes?: string,
  ) =>
    apiRequestBrowser<ShopOrder>(`/admin/shop/orders/${orderId}/fulfillment`, {
      method: "PATCH",
      body: JSON.stringify({ fulfillmentStatus, notes }),
    }),

  createCoupon: (dto: Omit<ShopCoupon, "id" | "usedCount" | "createdAt">) =>
    apiRequestBrowser<ShopCoupon>("/admin/shop/coupons", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  toggleCoupon: (id: number) =>
    apiRequestBrowser<ShopCoupon>(`/admin/shop/coupons/${id}/toggle`, { method: "POST" }),

  deleteCoupon: (id: number) =>
    apiRequestBrowser<{ id: number }>(`/admin/shop/coupons/${id}`, { method: "DELETE" }),
};
