"use client";

import { Bell, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminNotificationsApi,
  type AdminNotification,
} from "@/features/notifications/api";
import { useLocalization } from "@/shared/context/LocalizationContext";

export function AdminNotificationsBell() {
  const router = useRouter();
  const { formatDateTime } = useLocalization();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminNotificationsApi
      .unreadCount()
      .then((r) => setUnread(r.data.count))
      .catch(() => null);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = 0;
  }, [open, items]);

  function toggle() {
    if (!open && !loaded) {
      startTransition(async () => {
        const res = await adminNotificationsApi.list().catch(() => null);
        if (res) setItems(res.data);
        setLoaded(true);
      });
    }
    setOpen((v) => !v);
  }

  function markRead(id: number) {
    startTransition(async () => {
      await adminNotificationsApi.markRead(id).catch(() => null);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await adminNotificationsApi.markAllRead().catch(() => null);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    });
  }

  function handleClick(n: AdminNotification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-black dark:text-white shadow-sm shadow-black/[0.03] hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand/10 dark:hover:text-brand hover:scale-105 active:scale-95 transition-all duration-200"
        title="Notifications"
      >
        <Bell size={16} weight="fill" />
        {unread > 0 && (
          <span className="badge-glow absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={isPending}
                  className="text-xs font-medium text-brand-600 dark:text-brand hover:text-brand-700"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800" style={{ overflowAnchor: "none" }}>
            {!loaded && isPending && (
              <p className="text-center py-8 text-sm text-gray-400 dark:text-slate-500">Loading…</p>
            )}
            {loaded && items.length === 0 && (
              <p className="text-center py-8 text-sm text-gray-400 dark:text-slate-500">No notifications</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`px-4 py-3 space-y-0.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                  !n.isRead ? "bg-brand-50 dark:bg-brand/10" : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                {n.body && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{n.body}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {n.createdAt ? formatDateTime(n.createdAt) : ""}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-xs font-medium text-brand-600 dark:text-brand hover:text-brand-700 border-t border-gray-100 dark:border-slate-800"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
