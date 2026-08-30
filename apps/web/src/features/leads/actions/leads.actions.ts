"use server";

import { leadsApi, type CreateLeadPayload } from "@/features/leads/api";
import { ApiError, apiRequest, publicApiRequest } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      return err.errors.map((e) => e.message).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/**
 * Captures a guest checkout as a lead BEFORE the payment gateway runs, so
 * even abandoned payments leave a trail the admin can follow up on.
 */
export async function createLeadAction(payload: CreateLeadPayload) {
  try {
    const res = await leadsApi.create(payload);
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/**
 * Initiates the PayStation hosted-checkout for an already-captured lead.
 * Returns the gateway URL — caller redirects the browser to it.
 */
export async function initiateLeadPaymentAction(leadId: number, callbackUrl: string) {
  try {
    const res = await leadsApi.initiatePayment(leadId, callbackUrl);
    return {
      success: true as const,
      data: { paymentUrl: res.data.paymentUrl, orderId: res.data.orderId },
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/**
 * Phase 4 — soft capture from the course detail page LeadCaptureBox.
 * Just phone + courseId, admin follows up.
 */
export async function createInterestLeadAction(payload: { phone: string; courseId: number }) {
  try {
    const res = await leadsApi.createInterest(payload);
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/**
 * Phase 5 — capture from the global "Request a Callback" floating widget.
 * Full contact info, no course context — admin treats as warm-but-undirected.
 */
export async function createCallbackLeadAction(payload: {
  name: string;
  email: string;
  phone: string;
}) {
  try {
    const res = await leadsApi.createCallback(payload);
    return { success: true as const, data: { id: res.data.id } };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/**
 * Silent capture — guest filled the checkout form and paused 1.5s without
 * clicking "Complete Payment". Fire-and-forget; always returns void.
 */
export async function captureAbandonedCheckoutAction(payload: {
  name: string;
  email: string;
  phone: string;
  courseIds: number[];
  subtotal?: number;
  discountAmount?: number;
  finalAmount?: number;
}): Promise<void> {
  try {
    await publicApiRequest("/leads/silent/abandoned-checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch { /* intentionally swallowed */ }
}

/**
 * Silent capture — logged-in user visited the checkout page with courses but
 * left without paying. Requires a valid session cookie (forwarded automatically
 * by the Next.js server action runtime).
 */
export async function captureCheckoutVisitAction(courseIds: number[]): Promise<void> {
  try {
    await apiRequest("/leads/silent/checkout-visit", {
      method: "POST",
      body: JSON.stringify({ courseIds }),
    });
  } catch { /* intentionally swallowed */ }
}
