"use server";

import { revalidatePath } from "next/cache";
import { invoiceSettingsApi, type InvoiceSettings } from "./api";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export async function getInvoiceSettingsAction() {
  try {
    const res = await invoiceSettingsApi.get();
    return { success: true as const, data: res.data as Record<string, string> };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateInvoiceSettingsAction(data: Partial<InvoiceSettings>) {
  try {
    const res = await invoiceSettingsApi.update(data);
    revalidatePath("/admin/invoice-settings");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
