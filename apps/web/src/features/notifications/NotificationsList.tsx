"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  BookOpen,
  Calendar,
  FileCheck,
  CreditCard,
  Award,
  Megaphone,
  Settings,
  Filter,
} from "lucide-react";
import { notificationsApi, type Notification } from "@/features/notifications/api";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  course_update: { icon: BookOpen, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  class_reminder: { icon: Calendar, color: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" },
  assignment: { icon: FileCheck, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  payment: { icon: CreditCard, color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
  certificate: { icon: Award, color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
  announcement: { icon: Megaphone, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
  system: { icon: Settings, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Bell, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
}

type FilterType = "all" | "unread";

export function NotificationsList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    notificationsApi
      .list()
      .then((r) => setNotifications(r.data))
      .catch(() => null)
      .finally(() => setLoaded(true));
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
          {unread > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {unread} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setFilter("all")}
              aria-label="Show all notifications"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                filter === "all" ? "bg-brand text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              aria-label={`Show unread notifications (${unread})`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                filter === "unread" ? "bg-brand text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Unread ({unread})
            </button>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={isPending}
              aria-label="Mark all notifications as read"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {!loaded && (
          <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
        )}
        {loaded && filtered.length === 0 && (
          <div className="py-16 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              {filter === "unread" ? "No unread notifications" : "You have no notifications yet"}
            </p>
          </div>
        )}
        {filtered.map((n) => {
          const tc = getTypeConfig(n.type);
          const Icon = tc.icon;
          return (
            <div
              key={n.id}
              role={n.link ? "link" : "button"}
              tabIndex={0}
              onClick={() => handleClick(n)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(n);
                }
              }}
              aria-label={`${n.title}${n.body ? `: ${n.body}` : ""}${!n.isRead ? " (unread)" : ""}`}
              className={`flex gap-3 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${
                n.link ? "cursor-pointer" : ""
              } ${!n.isRead ? "bg-brand-50/60 dark:bg-brand-950/20" : ""}`}
            >
              {!n.isRead && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              )}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tc.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className={`min-w-0 flex-1 ${n.isRead ? "pl-0" : ""}`}>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
