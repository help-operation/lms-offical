import { apiRequest } from "@/lib/api-client";

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
  couponId: number | null;
  status: "pending" | "paid" | "cancelled";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  items: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  title: string;
}

export const shopApi = {
  getProducts: () => apiRequest<ShopProduct[]>("/shop/products"),
  getProduct: (slug: string) => apiRequest<ShopProduct>(`/shop/products/${slug}`),
};
