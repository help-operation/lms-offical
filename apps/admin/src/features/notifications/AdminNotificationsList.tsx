"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Checks,
  Headset,
  UserPlus,
  GraduationCap,
  UserList,
} from "@phosphor-icons/react";
import {
  adminNotificationsApi,
  type AdminNotification,
} from "@/features/notifications/api";
import { useLocalization } from "@/shared/context/LocalizationContext";

const typeMeta: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  support_ticket: { icon: Headset, color: "text-amber-600", bg: "bg-amber-50" },
  lead: { icon: UserList, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
  signup: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  enrollment: { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
};

export function AdminNotificationsList() {
  const router = useRouter();
  const { formatDateTime } = useLocalization();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    adminNotificationsApi
      .list()
      .then((r) => setItems(r.data))
      .catch(() => null)
      .finally(() => setLoaded(true));
  }, []);

  const unread = items.filter((n) => !n.isRead).length;

  function markRead(id: number) {
    startTransition(async () => {
      await adminNotificationsApi.markRead(id).catch(() => null);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await adminNotificationsApi.markAllRead().catch(() => null);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  }

  function handleClick(n: AdminNotification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            New tickets, leads, signups, and enrollments across the platform.
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <Checks size={16} weight="bold" />
            Mark all read
          </button>
        )}
      </div>

      {unread > 0 && (
        <div className="rounded-2xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-700">
          You have <span className="font-semibold">{unread}</span> unread
          notification{unread === 1 ? "" : "s"}.
        </div>
      )}

      <div className="space-y-3">
        {!loaded &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-gray-100 bg-white animate-pulse"
            />
          ))}

        {loaded && items.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
            <Bell size={32} className="mx-auto mb-3 text-gray-300" weight="fill" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        )}

        {items.map((n) => {
          const meta = typeMeta[n.type] ?? {
            icon: Bell,
            color: "text-gray-500",
            bg: "bg-gray-100",
          };
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3.5 rounded-2xl border p-5 transition-colors ${
                n.link ? "cursor-pointer hover:border-brand-200" : ""
              } ${
                !n.isRead
                  ? "border-brand-100 bg-brand-50/50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${meta.bg}`}
              >
                <Icon size={20} weight="fill" className={meta.color} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                  )}
                </div>
                {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-1.5">
                  {n.createdAt ? formatDateTime(n.createdAt) : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
