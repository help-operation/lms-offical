"use server";

import { revalidatePath } from "next/cache";
import { leadsAdminApi, type LeadStatus } from "@/features/leads/api";
import { ApiError } from "@/lib/api-client";

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

export async function updateLeadAction(
  id: number,
  data: {
    status?: LeadStatus;
    notes?: string | null;
    paymentMethod?: string | null;
  },
) {
  try {
    await leadsAdminApi.update(id, data);
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${id}`);
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteLeadAction(id: number) {
  try {
    await leadsAdminApi.delete(id);
    revalidatePath("/admin/leads");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
