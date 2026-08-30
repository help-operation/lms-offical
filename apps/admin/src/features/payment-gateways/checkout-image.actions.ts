"use server";

import { apiRequest } from "@/lib/api-client";

export async function getCheckoutPaymentImageAction(): Promise<string> {
  try {
    const res = await apiRequest<Record<string, string>>("/system-settings/public?keys=payment_checkout_image");
    return (res.data as any)?.payment_checkout_image ?? "";
  } catch {
    return "";
  }
}

export async function updateCheckoutPaymentImageAction(value: string) {
  const res = await apiRequest<Record<string, string>>("/system-settings/payment_checkout_image", {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
  return res;
}
