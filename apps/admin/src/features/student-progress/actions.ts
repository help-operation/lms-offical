"use server";

import { apiRequest } from "@/lib/api-client";
import type { ProgressResponse } from "./types";

export async function getStudentProgressAction(params?: {
  search?:   string;
  status?:   string;
  page?:     number;
  per_page?: number;
}) {
  try {
    const q = new URLSearchParams();
    if (params?.search)   q.set("search",   params.search);
    if (params?.status)   q.set("status",   params.status);
    if (params?.page)     q.set("page",     String(params.page));
    if (params?.per_page) q.set("per_page", String(params.per_page));

    const res = await apiRequest<ProgressResponse>(`/admin/progress?${q.toString()}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch progress" };
  }
}
