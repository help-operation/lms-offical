import { apiRequest } from "@/lib/api-client";
import type {
  MediaListParams,
  MediaListResponse,
  MediaFile,
} from "@/features/media/types";

export const mediaAdminApi = {
  // ── List ──────────────────────────────────────────────────────────────────
  list: (params?: MediaListParams) => {
    const q = new URLSearchParams();
    if (params?.page)          q.set("page",           String(params.page));
    if (params?.perPage)       q.set("per_page",        String(params.perPage));
    if (params?.search)        q.set("search",          params.search);
    if (params?.type && params.type !== "all") q.set("type", params.type);
    if (params?.sortField)     q.set("sort_field",      params.sortField);
    if (params?.sortDirection) q.set("sort_direction",  params.sortDirection);
    const qs = q.toString();
    return apiRequest<MediaListResponse>(`/admin/media${qs ? `?${qs}` : ""}`);
  },

  // ── Presign: get a presigned PUT URL for direct R2 upload ─────────────────
  presign: (mimeType: string, filename: string) =>
    apiRequest<{ presignedUrl: string; publicUrl: string; key: string }>(
      "/admin/media/presign",
      {
        method: "POST",
        body:   JSON.stringify({ mimeType, filename }),
      },
    ),

  // ── Register: save file metadata to DB after browser PUT to R2 ────────────
  register: (data: {
    url:          string;
    key:          string;
    filename:     string;
    originalName: string;
    mimeType:     string;
    size:         number;
  }) =>
    apiRequest<MediaFile>("/admin/media/register", {
      method: "POST",
      body:   JSON.stringify(data),
    }),

  // ── Update metadata ───────────────────────────────────────────────────────
  update: (id: number, data: { filename?: string; altText?: string; caption?: string }) =>
    apiRequest<MediaFile>(`/admin/media/${id}`, {
      method: "PATCH",
      body:   JSON.stringify(data),
    }),

  // ── Delete one ────────────────────────────────────────────────────────────
  delete: (id: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/media/${id}`, { method: "DELETE" }),

  // ── Bulk delete ───────────────────────────────────────────────────────────
  bulkDelete: (ids: number[]) =>
    apiRequest<{ deleted: number }>("/admin/media/bulk-delete", {
      method: "POST",
      body:   JSON.stringify({ ids }),
    }),
};
