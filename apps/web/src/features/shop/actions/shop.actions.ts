"use server";

import { apiRequest } from "@/lib/api-client";

export async function consumeShopPaymentToken(token: string) {
  try {
    const result = await apiRequest<Record<string, string>>(
      "/payment-confirmations/consume",
      { method: "POST", body: JSON.stringify({ token }) }
    );
    return result;
  } catch {
    return null;
  }
}
