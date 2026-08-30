"use server";

import { apiRequest } from "@/lib/api-client";
import type {
  AdminCertificate,
  CertificatesResponse,
  CourseOption,
  UserOption,
} from "./types";

export async function getCertificatesAction(params?: {
  search?: string;
  page?: number;
  perPage?: number;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (params?.search)    query.set("search",    params.search);
    if (params?.page)      query.set("page",      String(params.page));
    if (params?.perPage)   query.set("perPage",   String(params.perPage));
    if (params?.date_from) query.set("date_from", params.date_from);
    if (params?.date_to)   query.set("date_to",   params.date_to);

    const res = await apiRequest<CertificatesResponse>(
      `/admin/certificates?${query.toString()}`,
    );
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch certificates" };
  }
}

export async function issueCertificateManuallyAction(userId: number, courseId: number) {
  try {
    const res = await apiRequest<AdminCertificate>("/admin/certificates/issue", {
      method: "POST",
      body: JSON.stringify({ userId, courseId }),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to issue certificate" };
  }
}

// ─── Pickers ───────────────────────────────────────────────────────────────────

/** Search students/users by name, email or phone for the issue modal. An empty
 *  query returns the most recent users so the dropdown is never blank. */
export async function searchUsersAction(query: string) {
  try {
    const params = new URLSearchParams({ perPage: "8" });
    if (query.trim()) params.set("search", query.trim());
    const res = await apiRequest<{ data: UserOption[] }>(
      `/admin/users?${params.toString()}`,
    );
    return { success: true as const, data: res.data?.data ?? [] };
  } catch {
    return { success: false as const, data: [] as UserOption[] };
  }
}

/** Search published courses by title for the issue modal. */
export async function searchCoursesAction(query: string) {
  try {
    const params = new URLSearchParams({ limit: "8" });
    if (query.trim()) params.set("search", query.trim());
    const res = await apiRequest<CourseOption[]>(`/courses?${params.toString()}`);
    return { success: true as const, data: res.data ?? [] };
  } catch {
    return { success: false as const, data: [] as CourseOption[] };
  }
}
