export interface InvoiceCourseItem {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  price: string;
  /** Real quantity for shop-order line items; always 1 for course items. */
  quantity?: number;
}

export interface Invoice {
  type: "regular" | "live" | "shop";
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
  orderId: number | null;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  orderStatus: string;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  items: InvoiceCourseItem[];
}

export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  revenue: number;
}

export interface InvoicesResponse {
  data: Invoice[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  stats: InvoiceStats;
}
