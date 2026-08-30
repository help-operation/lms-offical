"use server";

import { revalidatePath } from "next/cache";
import { paymentGatewaysApi } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getPaymentGatewaysAction() {
  try {
    const res = await paymentGatewaysApi.list();
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updatePaymentGatewayAction(
  gateway: string,
  body: { enabled?: boolean; credentials?: Record<string, string> },
) {
  try {
    const res = await paymentGatewaysApi.update(gateway, body);
    revalidatePath("/admin/settings/payment");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function activatePaymentGatewayAction(gateway: string) {
  try {
    const res = await paymentGatewaysApi.activate(gateway);
    revalidatePath("/admin/settings/payment");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
