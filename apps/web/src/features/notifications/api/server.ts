import { apiRequest } from "@/lib/api-client";

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

export const notificationsServerApi = {
  list: () => apiRequest<Notification[]>("/notifications"),
  unreadCount: () => apiRequest<{ count: number }>("/notifications/unread-count"),
};
