"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { notificationsApi, type Notification } from "@/features/notifications/api";

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsApi.unreadCount().then((r) => setUnread(r.data.count)).catch(() => null);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    if (!open && !loaded) {
      startTransition(async () => {
        const res = await notificationsApi.list().catch(() => null);
        if (res) setNotifications(res.data);
        setLoaded(true);
      });
    }
    setOpen((v) => !v);
  }

  function markRead(id: number) {
    startTransition(async () => {
      await notificationsApi.markRead(id).catch(() => null);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    });
  }

  function handleClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  function markAllRead() {
    startTransition(async () => {
      await notificationsApi.markAllRead().catch(() => null);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} disabled={isPending} className="text-xs text-brand-600 hover:text-brand-700">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {!loaded && isPending && (
              <p className="text-center py-8 text-sm text-gray-400">Loading…</p>
            )}
            {loaded && notifications.length === 0 && (
              <p className="text-center py-8 text-sm text-gray-400">No notifications</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`px-4 py-3 space-y-0.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !n.isRead ? "bg-brand-50" : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>}
                <p className="text-xs text-gray-400">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-xs font-medium text-brand-600 hover:text-brand-700 border-t border-gray-100"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
