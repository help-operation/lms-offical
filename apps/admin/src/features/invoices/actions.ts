"use server";

import { apiRequest } from "@/lib/api-client";
import type { InvoicesResponse } from "./api";

export interface InvoicesQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

export async function getInvoicesAction(params: InvoicesQuery = {}) {
  try {
    const q = new URLSearchParams();
    if (params.page)     q.set("page",     String(params.page));
    if (params.per_page) q.set("per_page", String(params.per_page));
    if (params.search)   q.set("search",   params.search);
    if (params.status)   q.set("status",   params.status);

    const qs = q.toString();
    const res = await apiRequest<InvoicesResponse>(`/admin/invoices${qs ? `?${qs}` : ""}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch invoices" };
  }
}
