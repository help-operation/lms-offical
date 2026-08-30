import { publicApiRequest } from "@/lib/api-client";

export interface Lead {
  id: number;
  name: string | null;          // null for interest-box leads
  email: string | null;         // null for interest-box leads
  phone: string;
  source: "checkout" | "interest_box" | "callback_widget" | "manual";
  courseIds: number[];
  couponCode: string | null;
  subtotal: string;
  discountAmount: string;
  finalAmount: string;
  paymentMethod: string | null;
  status: "pending" | "paid" | "converted" | "cancelled";
  notes: string | null;
  convertedUserId: number | null;
  orderId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CreateLeadPayload = {
  name: string;
  email: string;
  phone: string;
  courseIds: number[];
  couponCode?: string | null;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string | null;
};

export interface LeadPaymentInitResult {
  leadId: number;
  orderId: number;
  paymentUrl: string;
  invoiceNumber: string;
}

/**
 * Public — anonymous lead capture + PayStation initiation from the guest
 * checkout. Both endpoints are cookie-free because the caller has no session.
 */
export const leadsApi = {
  create: (payload: CreateLeadPayload) =>
    publicApiRequest<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Initiates a PayStation hosted checkout for a previously-captured lead.
   * Server returns a `paymentUrl` — caller should redirect the browser to it.
   */
  initiatePayment: (leadId: number, callbackUrl: string) =>
    publicApiRequest<LeadPaymentInitResult>(`/leads/${leadId}/initiate-payment`, {
      method: "POST",
      body: JSON.stringify({ callbackUrl }),
    }),

  /**
   * Phase 4 — soft capture from the course detail page interest box.
   * Phone-only; admin follows up later.
   */
  createInterest: (payload: { phone: string; courseId: number }) =>
    publicApiRequest<Lead>("/leads/interest", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Phase 5 — capture from the global "Request a Callback" floating widget.
   * Full contact info, no course context.
   */
  createCallback: (payload: { name: string; email: string; phone: string }) =>
    publicApiRequest<Lead>("/leads/callback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
