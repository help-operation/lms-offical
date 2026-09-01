import { apiRequest } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaymentStats {
  totalRevenue: string;
  monthRevenue: string;
  todayRevenue: string;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  dueAmount: string;
  tabCounts: { all: number; completed: number; pending: number; failed: number; refunded: number };
  topCourses: { courseId: number; title: string; revenue: string; count: number }[];
  methodBreakdown: { method: string; total: string; count: number }[];
}

export interface PaymentListItem {
  id: number;
  invoiceNumber: string | null;
  userId: number;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  courseTitles: string | null;
  orderId: number;
  amount: string;
  method: string;
  status: string;
  paystationTrxId: string | null;
  bkashTrxId: string | null;
  payerPhone: string | null;
  paidAt: string | null;
  createdAt: string | null;
  totalAmount: string;
  finalAmount: string;
}

export interface PaymentDetail {
  id: number;
  invoiceNumber: string | null;
  userId: number;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  orderId: number;
  amount: string;
  method: string;
  paystationMethod: string | null;
  status: string;
  paystationTrxId: string | null;
  paystationInvoiceId: string | null;
  bkashTrxId: string | null;
  payerPhone: string | null;
  paidAt: string | null;
  createdAt: string | null;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  items: { courseId: number; courseTitle: string; courseSlug: string; price: string }[];
  allPayments: { id: number; amount: string; method: string; status: string; paidAt: string | null; displayInvoiceNumber: string | null }[];
  totalPaid: string;
  dueAmount: string;
  paymentStatus: string;
}

export interface StudentPaymentHistory {
  student: { id: number; firstName: string; lastName: string; email: string | null; phone: string | null };
  enrollments: { orderId: number | null; courseId: number; courseTitle: string; enrolledAt: string | null; status: string }[];
  orderPayments: { orderId: number; id: number; amount: string; method: string; status: string; paidAt: string | null; displayInvoiceNumber: string | null }[];
  orderInfo: { id: number; totalAmount: string; finalAmount: string; status: string }[];
  liveEnrollments: { id: number; courseTitle: string; amount: string; status: string; paidAt: string | null; createdAt: string | null; displayInvoiceNumber: string | null }[];
  summary: { totalFees: string; totalPaid: string; totalDue: string };
}

export interface PaginatedPayments {
  data: PaymentListItem[];
  pagination: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number };
}

export interface DailyReport {
  date: string;
  payments: { id: number; invoiceNumber: string | null; userFirstName: string | null; userLastName: string | null; amount: string; method: string; status: string; paidAt: string | null }[];
  totalCollected: string;
  totalCount: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  payments: { id: number; invoiceNumber: string | null; userFirstName: string | null; userLastName: string | null; amount: string; method: string; status: string; paidAt: string | null; courseTitles: string | null }[];
  totalCollected: string;
  totalCount: number;
}

export interface CourseRevenue {
  courseId: number;
  courseTitle: string;
  totalRevenue: string;
  totalPayments: number;
  completedPayments: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: string;
  count: number;
}

// ─── API Functions ──────────────────────────────────────────────────────────

function qs(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString();
}

export const paymentsApi = {
  stats: () => apiRequest<PaymentStats>('/admin/payments/stats'),

  list: (params: Record<string, unknown> = {}) => {
    const s = qs(params);
    return apiRequest<PaginatedPayments>(`/admin/payments/list${s ? `?${s}` : ''}`);
  },

  detail: (id: number) => apiRequest<PaymentDetail>(`/admin/payments/${id}`),

  studentHistory: (userId: number) => apiRequest<StudentPaymentHistory>(`/admin/payments/student/${userId}`),

  refund: (id: number) =>
    apiRequest<{ success: boolean; paymentId: number }>(`/admin/payments/${id}/refund`, { method: 'POST' }),

  dailyReport: (date?: string) => {
    const s = date ? `?date=${date}` : '';
    return apiRequest<DailyReport>(`/admin/payments/reports/daily${s}`);
  },

  monthlyReport: (year?: number, month?: number) => {
    const params: Record<string, unknown> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const s = qs(params);
    return apiRequest<MonthlyReport>(`/admin/payments/reports/monthly${s ? `?${s}` : ''}`);
  },

  courseReport: () => apiRequest<CourseRevenue[]>('/admin/payments/reports/courses'),

  revenueChart: (period: string = '30d') =>
    apiRequest<RevenueChartPoint[]>(`/admin/payments/reports/chart?period=${period}`),

  courses: () => apiRequest<{ id: number; title: string }[]>('/admin/payments/courses'),
};
