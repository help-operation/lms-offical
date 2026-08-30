import { apiRequest } from "@/lib/api-client";

export interface PaymentCourseItem {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  price: string;
}

export interface MyPayment {
  paymentId: number;
  amount: string;
  method: "bkash" | "paystation" | "free" | "ssl";
  status: "pending" | "completed" | "failed";
  paystationInvoiceId: string | null;
  displayInvoiceNumber: string | null;
  paystationTrxId: string | null;
  paystationMethod: string | null;
  bkashTrxId: string | null;
  paidAt: string | null;
  createdAt: string | null;
  orderId: number;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  items: PaymentCourseItem[];
}

export const myPaymentsApi = {
  list: () => apiRequest<MyPayment[]>("/orders/my-payments"),
};
