"use client";

import { useState, useTransition, useCallback } from "react";
import { Mail, MailOpen, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { contactMessagesApiBrowser } from "./api/browser";
import { getContactMessagesAction } from "./actions";
import type { ContactMessage, ContactMessagesResponse } from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

type Filter = "all" | "unread" | "read";

interface Props { initial: ContactMessagesResponse }

export function ContactMessagesManager({ initial }: Props) {
  const { formatDateTime } = useLocalization();
  const [messages,    setMessages]    = useState<ContactMessage[]>(initial.data);
  const [pagination,  setPagination]  = useState(initial.pagination);
  const [unreadCount, setUnreadCount] = useState(initial.unreadCount);
  const [selected,    setSelected]    = useState<ContactMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [filter,      setFilter]      = useState<Filter>("all");
  const [page,        setPage]        = useState(1);
  const [isPending,   startTransition] = useTransition();

  const load = useCallback((p: number, f: Filter) => {
    startTransition(async () => {
      const res = await getContactMessagesAction({
        page: p, per_page: 20,
        read: f === "all" ? undefined : f,
      });
      if (res.success) {
        setMessages(res.data.data);
        setPagination(res.data.pagination);
        setUnreadCount(res.data.unreadCount);
      }
    });
  }, []);

  function handleFilter(f: Filter) {
    setFilter(f);
    setPage(1);
    load(1, f);
  }

  function handlePage(p: number) {
    setPage(p);
    load(p, filter);
  }

  function markRead(msg: ContactMessage) {
    if (msg.isRead) return;
    startTransition(async () => {
      const res = await contactMessagesApiBrowser.markRead(msg.id).catch(() => null);
      if (!res) return;
      setMessages((p) => p.map((m) => m.id === msg.id ? { ...m, isRead: true } : m));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (selected?.id === msg.id) setSelected({ ...msg, isRead: true });
    });
  }

  function remove(msg: ContactMessage) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await contactMessagesApiBrowser.delete(msg.id).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      if (selected?.id === msg.id) setSelected(null);
      toast.success("Message deleted");
      load(page, filter);
    });
  }

  function open(msg: ContactMessage) {
    setSelected(msg);
    markRead(msg);
  }

  return (
    <div className="p-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Message"
        message={deleteTarget ? <>Delete message from <strong>{deleteTarget.name || "Unknown"}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Contact Messages
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{unreadCount}</span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Messages submitted via the contact form.</p>
        </div>
        {/* Filter */}
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Message list */}
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {messages.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400">No messages.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  onClick={() => open(msg)}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors ${
                    selected?.id === msg.id ? "bg-brand-50" : "hover:bg-gray-50"
                  } ${!msg.isRead ? "bg-blue-50/40" : ""}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {msg.isRead
                      ? <MailOpen className="h-4 w-4 text-gray-400" />
                      : <Mail className="h-4 w-4 text-brand-600" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!msg.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {msg.name}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0">{msg.createdAt ? formatDateTime(msg.createdAt) : ""}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{msg.subject || "(no subject)"}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{msg.message}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg); }}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 mt-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {pagination.from}–{pagination.to} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page <= 1 || isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 px-1">
                  {page} / {pagination.last_page}
                </span>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page >= pagination.last_page || isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900 truncate">{selected.subject || "(no subject)"}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-14">From</span>
                    <span className="text-sm font-medium text-gray-900">{selected.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-14">Email</span>
                    <a href={`mailto:${selected.email}`} className="text-sm text-brand-600 hover:underline">{selected.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-14">Date</span>
                    <span className="text-sm text-gray-500">{selected.createdAt ? formatDateTime(selected.createdAt) : ""}</span>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="border-t border-gray-100 px-5 py-3.5">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject || ""}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  <Mail className="h-4 w-4" /> Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Mail className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
