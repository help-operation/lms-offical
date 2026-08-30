"use server";

import { revalidatePath } from "next/cache";
import { supportAdminApi } from "@/features/admin/api/support";
import type { Attachment } from "@/features/admin/api/support";
import { ApiError } from "@/lib/api-client";

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0)
      return err.errors.map((e: { message: string }) => e.message).join(", ");
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export interface TicketsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category?: string;
  slaBreach?: string;
  unassigned?: string;
  assignedTo?: string;
}

export async function getTicketsAction(params: TicketsQuery = {}) {
  try {
    const q = new URLSearchParams();
    if (params.page)       q.set("page",       String(params.page));
    if (params.per_page)   q.set("per_page",   String(params.per_page));
    if (params.search)     q.set("search",     params.search);
    if (params.status)     q.set("status",     params.status);
    if (params.category)   q.set("category",   params.category);
    if (params.slaBreach)  q.set("slaBreach",  params.slaBreach);
    if (params.unassigned) q.set("unassigned", params.unassigned);
    if (params.assignedTo) q.set("assignedTo", params.assignedTo);
    const res = await supportAdminApi.tickets(q.toString());
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function fetchTicketAction(id: number) {
  try {
    const res = await supportAdminApi.getTicket(id);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getStatsAction() {
  try {
    const res = await supportAdminApi.stats();
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function replyTicketAction(
  id: number,
  data: { message: string; isInternal?: boolean; attachments?: Attachment[] },
) {
  try {
    const res = await supportAdminApi.reply(id, data);
    revalidatePath(`/admin/support/${id}`);
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateTicketStatusAction(
  id: number,
  data: { status: "open" | "in_progress" | "resolved" | "closed"; priority?: "low" | "medium" | "high" | "urgent" },
) {
  try {
    const res = await supportAdminApi.updateStatus(id, data);
    revalidatePath("/admin/support");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function assignTicketAction(id: number, adminId: number | null) {
  try {
    const res = await supportAdminApi.assign(id, adminId);
    revalidatePath("/admin/support");
    return { success: true as const, data: res.data };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function bulkTicketAction(data: {
  ids: number[];
  action: "close" | "resolve" | "assign" | "set_priority";
  adminId?: number | null;
  priority?: string;
}) {
  try {
    const res = await supportAdminApi.bulkAction(data);
    revalidatePath("/admin/support");
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getAgentsAction() {
  try {
    const res = await supportAdminApi.agents();
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function getAnalyticsAction(days = 30) {
  try {
    const res = await supportAdminApi.analytics(days);
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function listCannedResponsesAction() {
  try {
    const res = await supportAdminApi.listCanned();
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function createCannedResponseAction(data: {
  title: string;
  body: string;
  category?: string;
  sortOrder?: number;
}) {
  try {
    const res = await supportAdminApi.createCanned(data);
    revalidatePath("/admin/support/canned-responses");
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function updateCannedResponseAction(
  id: number,
  data: { title?: string; body?: string; category?: string; sortOrder?: number },
) {
  try {
    const res = await supportAdminApi.updateCanned(id, data);
    revalidatePath("/admin/support/canned-responses");
    return { success: true as const, data: res.data! };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

export async function deleteCannedResponseAction(id: number) {
  try {
    await supportAdminApi.deleteCanned(id);
    revalidatePath("/admin/support/canned-responses");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
