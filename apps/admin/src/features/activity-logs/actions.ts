"use server";

import { apiRequest } from "@/lib/api-client";
import type { ActivityLogsResponse } from "./types";

export async function getActivityLogsAction(params?: {
  page?:              number;
  search?:            string;
  actor?:             string;
  per_page?:          number;
  sort_field?:        string;
  sort_direction?:    string;
  date_from?:         string;
  date_to?:           string;
}) {
  try {
    const q = new URLSearchParams();
    if (params?.page)            q.set("page",            String(params.page));
    if (params?.search)          q.set("search",          params.search);
    if (params?.actor)           q.set("actor",           params.actor);
    if (params?.per_page)        q.set("per_page",        String(params.per_page));
    if (params?.sort_field)      q.set("sort_field",      params.sort_field);
    if (params?.sort_direction)  q.set("sort_direction",  params.sort_direction);
    if (params?.date_from)       q.set("date_from",       params.date_from);
    if (params?.date_to)         q.set("date_to",         params.date_to);
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
