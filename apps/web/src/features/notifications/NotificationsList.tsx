"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi, type Notification } from "@/features/notifications/api";

export function NotificationsList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    notificationsApi
      .list()
      .then((r) => setNotifications(r.data))
      .catch(() => null)
      .finally(() => setLoaded(true));
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  function markRead(id: number) {
    startTransition(async () => {
      await notificationsApi.markRead(id).catch(() => null);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await notificationsApi.markAllRead().catch(() => null);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  }

  function handleClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </h2>
          {unread > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {unread} unread
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {!loaded && (
          <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
        )}
        {loaded && notifications.length === 0 && (
          <div className="py-16 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">You have no notifications yet</p>
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className={`flex gap-3 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
              n.link ? "cursor-pointer" : ""
            } ${!n.isRead ? "bg-brand-50/60 dark:bg-brand-950/20" : ""}`}
          >
            {!n.isRead && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
            )}
            <div className={`min-w-0 flex-1 ${n.isRead ? "pl-5" : ""}`}>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {n.title}
              </p>
              {n.body && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {n.body}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
