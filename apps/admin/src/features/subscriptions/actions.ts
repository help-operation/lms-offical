"use server";

import { apiRequest } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export interface SubscriptionListItem {
  id: number;
  enrollmentId: number;
  status: string;
  amount: string;
  nextBillingAt: string | null;
  lastPaymentAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  courseTitle: string;
  courseSlug: string;
  userName: string;
  userPhone: string;
  userEmail: string;
}

export interface SubscriptionDetails extends SubscriptionListItem {
  gateway: string;
  gatewaySubscriptionId: string | null;
  courseMonthlyPrice: string | null;
  enrollmentStatus: string;
  payments: Array<{
    id: number;
    subscriptionId: number;
    amount: string;
    method: string;
    gatewayInvoiceId: string | null;
    gatewayTransactionId: string | null;
    status: string;
    gatewayResponse: unknown | null;
    paidAt: string | null;
    createdAt: string;
  }>;
}

export interface SubscriptionsListResponse {
  data: SubscriptionListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchSubscriptionsAction(status?: string, page = 1, limit = 20) {
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const res = await apiRequest<SubscriptionsListResponse>(
      `/live-subscriptions/admin/all?${params.toString()}`,
    );
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function fetchSubscriptionDetailsAction(id: number) {
  try {
    const res = await apiRequest<SubscriptionDetails>(`/live-subscriptions/admin/${id}`);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function cancelSubscriptionAdminAction(subscriptionId: number) {
  try {
    const res = await apiRequest<{ success: boolean }>(
      `/live-subscriptions/admin/${subscriptionId}/cancel`,
      { method: "POST" },
    );
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function pauseSubscriptionAdminAction(subscriptionId: number) {
  try {
    const res = await apiRequest<{ success: boolean }>(
      `/live-subscriptions/admin/${subscriptionId}/pause`,
      { method: "POST" },
    );
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}

export async function resumeSubscriptionAdminAction(subscriptionId: number) {
  try {
    const res = await apiRequest<{ success: boolean }>(
      `/live-subscriptions/admin/${subscriptionId}/resume`,
      { method: "POST" },
    );
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: extractMessage(err) };
  }
}
