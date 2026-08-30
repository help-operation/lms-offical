import { apiRequest } from "@/lib/api-client";

export interface Order {
  id: number;
  status: "pending" | "paid" | "cancelled";
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  createdAt: string | null;
}

export interface OrderDetail extends Order {
  items: {
    id: number;
    price: string;
    courseId: number;
    courseTitle: string;
    courseSlug: string;
  }[];
  payment: {
    id: number;
    method: string;
    bkashTrxId: string | null;
    status: string;
    paidAt: string | null;
  } | null;
}

export interface CouponValidation {
  coupon: { id: number; code: string; type: string; value: string; scope: string };
  discountAmount: number;
  applicableSubtotal: number;
}

export const ordersApi = {
  create: (courseIds: number[], couponCode?: string) =>
    apiRequest<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ courseIds, couponCode }),
    }),

  confirmBkash: (orderId: number, bkashTrxId: string) =>
    apiRequest<{ paid: boolean; orderId: number }>(`/orders/${orderId}/pay/bkash`, {
      method: "POST",
      body: JSON.stringify({ bkashTrxId }),
    }),

  validateCoupon: (code: string, courseIds: number[], liveCourseIds: number[] = []) =>
    apiRequest<CouponValidation>("/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({ code, courseIds, liveCourseIds }),
    }),

  list: () => apiRequest<Order[]>("/orders"),

  get: (orderId: number) => apiRequest<OrderDetail>(`/orders/${orderId}`),

  /** Lifetime paid-order count/value — consumed only by the tracking layer's hashed user-context push. */
  getStats: () => apiRequest<{ count: number; totalValue: number }>("/orders/my-stats"),
};
