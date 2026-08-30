import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { Order, OrderDetail, CouponValidation } from "./index";

export const ordersApiBrowser = {
  create: (courseIds: number[], couponCode?: string) =>
    apiRequestBrowser<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ courseIds, couponCode }),
    }),

  confirmBkash: (orderId: number, bkashTrxId: string) =>
    apiRequestBrowser<{ paid: boolean; orderId: number }>(`/orders/${orderId}/pay/bkash`, {
      method: "POST",
      body: JSON.stringify({ bkashTrxId }),
    }),

  /** Initiate a PayStation hosted payment — returns the payment_url to redirect to */
  initiatePaystation: (orderId: number, callbackUrl: string) =>
    apiRequestBrowser<{ paymentUrl: string; invoiceNumber: string }>(
      `/orders/${orderId}/pay/paystation`,
      {
        method: "POST",
        body: JSON.stringify({ callbackUrl }),
      }
    ),

  validateCoupon: (code: string, courseIds: number[], liveCourseIds: number[] = []) =>
    apiRequestBrowser<CouponValidation>("/orders/validate-coupon", {
      method: "POST",
      body: JSON.stringify({ code, courseIds, liveCourseIds }),
    }),
  list: () => apiRequestBrowser<Order[]>("/orders"),
  get: (orderId: number) => apiRequestBrowser<OrderDetail>(`/orders/${orderId}`),
};
