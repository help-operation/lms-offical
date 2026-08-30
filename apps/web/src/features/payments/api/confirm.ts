import { apiRequest } from "@/lib/api-client";

/** Display params the gateway callback stored against a one-time token. */
export interface PaymentConfirmation {
  status?: string; // "paid" | "already_paid" | "failed"
  orderId?: string;
  leadId?: string;
  invoice?: string;
  slug?: string;
  courseId?: string;
}

/**
 * Exchange (and consume) a one-time `?t=` token for its result-page params.
 * Returns `null` if the token is missing, already consumed (refresh/back), or
 * expired — the caller should then redirect away.
 */
export async function confirmPayment(
  token: string | undefined,
): Promise<PaymentConfirmation | null> {
  if (!token) return null;
  try {
    const { data } = await apiRequest<PaymentConfirmation | null>(
      "/payment-confirmations/consume",
      { method: "POST", body: JSON.stringify({ token }) },
    );
    return data;
  } catch {
    return null;
  }
}
