import { apiRequestBrowser } from "@/lib/api-client-browser";

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}

export const adminNotificationsApi = {
  list: () => apiRequestBrowser<AdminNotification[]>("/admin/notifications"),
  unreadCount: () =>
    apiRequestBrowser<{ count: number }>("/admin/notifications/unread-count"),
  markRead: (id: number) =>
    apiRequestBrowser<{ success: boolean }>(
      `/admin/notifications/${id}/read`,
      { method: "PATCH" },
    ),
  markAllRead: () =>
    apiRequestBrowser<{ success: boolean }>("/admin/notifications/read-all", {
      method: "PATCH",
    }),
};
