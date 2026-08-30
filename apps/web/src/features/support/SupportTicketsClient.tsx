"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Send, X, Loader2, Paperclip } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { Attachment, SupportTicket, SupportTicketDetail } from "@/features/support/api";
import { supportApiBrowser } from "@/features/support/api/browser";
import { TICKET_CATEGORY_LABELS } from "@repo/validators";

interface Props { initialTickets: SupportTicket[] }

const STATUS_COLOR: Record<string, string> = {
  open:        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  resolved:    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  closed:      "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400",
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    "text-gray-400 dark:text-slate-500",
  medium: "text-blue-500 dark:text-blue-400",
  high:   "text-orange-500 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
};

const CATEGORY_COLOR: Record<string, string> = {
  billing:        "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  technical:      "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  course_content: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  certificate:    "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  refund:         "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  other:          "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
};

const CATEGORY_OPTIONS = Object.entries(TICKET_CATEGORY_LABELS) as [string, string][];

// ─── Modal shell ─────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-2xl bg-white shadow-2xl dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SupportTicketsClient({ initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [isPending, startTransition] = useTransition();

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject]       = useState("");
  const [message, setMessage]       = useState("");
  const [category, setCategory]     = useState("other");
  const [error, setError]           = useState<string | null>(null);

  // Detail modal state
  const [detail, setDetail]                     = useState<SupportTicketDetail | null>(null);
  const [reply, setReply]                       = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading]               = useState(false);
  const fileRef                                 = useRef<HTMLInputElement>(null);

  function handleCreate() {
    if (!subject.trim() || !message.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await supportApiBrowser.create({
          subject: subject.trim(),
          message: message.trim(),
          category,
        });
        setTickets((prev) => [res.data, ...prev]);
        setSubject(""); setMessage(""); setCategory("other"); setShowCreate(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create ticket");
      }
    });
  }

  function openDetail(id: number) {
    startTransition(async () => {
      const res = await supportApiBrowser.getTicket(id).catch(() => null);
      if (res) {
        setDetail(res.data);
        setReply(""); setPendingAttachments([]);
        setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
      }
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const urlRes = await supportApiBrowser.attachmentUrl(file.type, file.name);
      const { presignedUrl, publicUrl } = urlRes.data;
      await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setPendingAttachments((prev) => [...prev, { url: publicUrl, name: file.name }]);
    } catch {
      setError("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleReply() {
    if (!reply.trim() || !detail) return;
    startTransition(async () => {
      const res = await supportApiBrowser
        .reply(detail.id, { message: reply.trim(), attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined })
        .catch(() => null);
      if (res) {
        setDetail((prev) =>
          prev ? { ...prev, messages: [...prev.messages, res.data] } : prev,
        );
        setReply(""); setPendingAttachments([]);
      }
    });
  }

  const columns: Column<SupportTicket>[] = [
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (t) => (
        <span className="flex items-center gap-2">
          {t.unread && (
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-600" title="New reply" aria-label="Unread" />
          )}
          <span className={t.unread ? "font-bold text-gray-900" : "font-medium text-gray-900"}>
            {t.subject}
          </span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (t) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[t.category] ?? "bg-gray-100 text-gray-500"}`}>
          {TICKET_CATEGORY_LABELS[t.category as keyof typeof TICKET_CATEGORY_LABELS] ?? t.category}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-500"}`}>
          {t.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (t) => (
        <span className={`text-xs font-semibold capitalize ${PRIORITY_COLOR[t.priority] ?? "text-gray-400"}`}>
          {t.priority}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (t) => (
        <span className="text-gray-500">
          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const replyDisabled = detail?.status === "closed" || detail?.status === "resolved";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowCreate(true); setError(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Support Ticket
        </button>
      </div>

      <DataTable
        data={tickets}
        columns={columns}
        searchable
        searchKeys={["subject", "status", "priority", "category"]}
        searchPlaceholder="Search tickets…"
        onRowClick={(t) => openDetail(t.id)}
        emptyMessage="No support tickets yet"
      />

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Support Ticket" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {CATEGORY_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <input
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject *"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue *"
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending || !subject.trim() || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {detail && (
        <Modal title={detail.subject} onClose={() => { setDetail(null); setReply(""); setPendingAttachments([]); }} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[detail.status] ?? "bg-gray-100 text-gray-500"}`}>
                {detail.status.replace("_", " ")}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[detail.category] ?? "bg-gray-100 text-gray-600"}`}>
                {TICKET_CATEGORY_LABELS[detail.category as keyof typeof TICKET_CATEGORY_LABELS] ?? detail.category}
              </span>
              <span className={`text-xs font-semibold capitalize ${PRIORITY_COLOR[detail.priority] ?? "text-gray-400"}`}>
                {detail.priority}
              </span>
            </div>

            {/* Messages — internal notes are already filtered out server-side */}
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              {detail.messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    {msg.userFirstName} {msg.userLastName} ·{" "}
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{msg.message}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.url}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        >
                          <Paperclip className="h-3 w-3" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {replyDisabled ? (
              <p className="text-center text-xs text-gray-400 dark:text-slate-500">
                This ticket is {detail.status}. Replies are disabled.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((att, i) => (
                      <span
                        key={att.url}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Paperclip className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                        {att.name}
                        <button
                          onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-0.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    title="Attach file"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-500 dark:hover:border-brand-500 dark:hover:text-brand-400"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
                  <button
                    onClick={handleReply}
                    disabled={isPending || !reply.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                    aria-label="Send reply"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
