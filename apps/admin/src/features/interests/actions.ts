"use server";

import { interestsAdminApi } from "./api";

export async function getInterestsAction(params?: {
  search?: string;
  courseId?: number;
  page?: number;
  limit?: number;
}) {
  try {
    const res = await interestsAdminApi.list(params);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch interests" };
  }
}
