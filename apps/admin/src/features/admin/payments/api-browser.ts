import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { PaymentStats, PaginatedPayments, PaymentDetail, StudentPaymentHistory, DailyReport, MonthlyReport, CourseRevenue, RevenueChartPoint } from "./api";

function qs(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString();
}

export const paymentsApiBrowser = {
  stats: () => apiRequestBrowser<PaymentStats>('/admin/payments/stats'),

  list: (params: Record<string, unknown> = {}) => {
    const s = qs(params);
    return apiRequestBrowser<PaginatedPayments>(`/admin/payments/list${s ? `?${s}` : ''}`);
  },

  detail: (id: number) => apiRequestBrowser<PaymentDetail>(`/admin/payments/${id}`),

  studentHistory: (userId: number) => apiRequestBrowser<StudentPaymentHistory>(`/admin/payments/student/${userId}`),

  refund: (id: number) =>
    apiRequestBrowser<{ success: boolean; paymentId: number }>(`/admin/payments/${id}/refund`, { method: 'POST' }),

  dailyReport: (date?: string) => {
    const s = date ? `?date=${date}` : '';
    return apiRequestBrowser<DailyReport>(`/admin/payments/reports/daily${s}`);
  },

  monthlyReport: (year?: number, month?: number) => {
    const params: Record<string, unknown> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const s = qs(params);
    return apiRequestBrowser<MonthlyReport>(`/admin/payments/reports/monthly${s ? `?${s}` : ''}`);
  },

  courseReport: () => apiRequestBrowser<CourseRevenue[]>('/admin/payments/reports/courses'),

  revenueChart: (period: string = '30d') =>
    apiRequestBrowser<RevenueChartPoint[]>(`/admin/payments/reports/chart?period=${period}`),

  courses: () => apiRequestBrowser<{ id: number; title: string }[]>('/admin/payments/courses'),
};
