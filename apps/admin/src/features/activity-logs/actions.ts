"use server";

import { apiRequest } from "@/lib/api-client";
import type { ActivityLogsResponse } from "./types";

export async function getActivityLogsAction(params?: {
  page?:   number;
  search?: string;
  actor?:  string;
}) {
  try {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.search) q.set("search", params.search);
    if (params?.actor)  q.set("actor",  params.actor);
    const res = await apiRequest<ActivityLogsResponse>(
      `/admin/activity-logs?${q.toString()}`,
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return {
      success: false as const,
      message: err?.message ?? "Failed to fetch activity logs",
    };
  }
}
