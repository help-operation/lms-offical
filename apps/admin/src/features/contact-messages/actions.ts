"use server";

import { apiRequest } from "@/lib/api-client";
import type { ContactMessagesResponse } from "./types";

export interface ContactMessagesQuery {
  page?: number;
  per_page?: number;
  search?: string;
  read?: "read" | "unread";
}

export async function getContactMessagesAction(params: ContactMessagesQuery = {}) {
  try {
    const q = new URLSearchParams();
    if (params.page)     q.set("page",     String(params.page));
    if (params.per_page) q.set("per_page", String(params.per_page));
    if (params.search)   q.set("search",   params.search);
    if (params.read)     q.set("read",     params.read);

    const qs = q.toString();
    const res = await apiRequest<ContactMessagesResponse>(`/contact-messages/admin${qs ? `?${qs}` : ""}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch messages" };
  }
}
