import { apiRequestBrowser } from "@/lib/api-client-browser";

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}

export const notificationsApi = {
  list: () => apiRequestBrowser<Notification[]>("/notifications"),
  unreadCount: () => apiRequestBrowser<{ count: number }>("/notifications/unread-count"),
  markRead: (id: number) =>
    apiRequestBrowser<{ success: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    apiRequestBrowser<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),
};
