import { apiRequest } from "@/lib/api-client";

// Two-state workflow; legacy values kept only so old rows still type-check.
export type LeadStatus = "pending" | "complete" | "paid" | "converted" | "cancelled";
export type LeadSource = "checkout" | "interest_box" | "callback_widget" | "manual" | "failed_payment" | "abandoned_checkout" | "checkout_visit" | "live_checkout";

export interface LeadCourseRef {
  id: number;
  title: string;
  slug: string;
}

export interface Lead {
  id: number;
  name: string | null;     // null for interest-box leads
  email: string | null;    // null for interest-box leads
  phone: string | null;
  source: LeadSource;
  courseIds: number[];
  courses: LeadCourseRef[];
  couponCode: string | null;
  subtotal: string;
  discountAmount: string;
  finalAmount: string;
  paymentMethod: string | null;
  status: LeadStatus;
  notes: string | null;
  convertedUserId: number | null;
  orderId: number | null;
  orderPaid: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LeadListResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadCounts {
  total: number;
  pending: number;
  complete: number;
  paid: number; // pending leads whose linked order is paid (awaiting fulfilment)
}

export const leadsAdminApi = {
  list: (params?: {
    status?: string;
    source?: string;
    search?: string;
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.status)    q.set("status",    params.status);
    if (params?.source)    q.set("source",    params.source);
    if (params?.search)    q.set("search",    params.search);
    if (params?.page)      q.set("page",      String(params.page));
    if (params?.limit)     q.set("limit",     String(params.limit));
    if (params?.date_from) q.set("date_from", params.date_from);
    if (params?.date_to)   q.set("date_to",   params.date_to);
    const qs = q.toString();
    return apiRequest<LeadListResponse>(`/admin/leads${qs ? `?${qs}` : ""}`);
  },

  counts: () => apiRequest<LeadCounts>("/admin/leads/counts"),

  get: (id: number) => apiRequest<Lead>(`/admin/leads/${id}`),

  update: (
    id: number,
    data: {
      status?: LeadStatus;
      notes?: string | null;
      paymentMethod?: string | null;
      convertedUserId?: number | null;
      orderId?: number | null;
    },
  ) =>
    apiRequest<Lead>(`/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/leads/${id}`, { method: "DELETE" }),
};
