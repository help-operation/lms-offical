"use server";

import { apiRequest } from "@/lib/api-client";
import type { Announcement, AnnouncementsResponse, AnnouncementType } from "./types";

export async function getAnnouncementsAction(params?: { page?: number }) {
  try {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    const res = await apiRequest<AnnouncementsResponse>(`/admin/announcements?${q.toString()}`);
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to fetch announcements" };
  }
}

export async function createAnnouncementAction(data: {
  title:     string;
  body:      string;
  type:      AnnouncementType;
  expiresAt: string | null;
}) {
  try {
    const res = await apiRequest<Announcement>("/admin/announcements", {
      method: "POST",
      body:   JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to create announcement" };
  }
}

export async function updateAnnouncementAction(id: number, data: {
  title?:     string;
  body?:      string;
  type?:      AnnouncementType;
  expiresAt?: string | null;
}) {
  try {
    const res = await apiRequest<Announcement>(`/admin/announcements/${id}`, {
      method: "PUT",
      body:   JSON.stringify(data),
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to update announcement" };
  }
}

export async function toggleAnnouncementAction(id: number) {
  try {
    const res = await apiRequest<Announcement>(`/admin/announcements/${id}/toggle`, {
      method: "POST",
    });
    return { success: true as const, data: res.data! };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to toggle" };
  }
}

export async function deleteAnnouncementAction(id: number) {
  try {
    await apiRequest(`/admin/announcements/${id}`, { method: "DELETE" });
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: err?.message ?? "Failed to delete" };
  }
}
