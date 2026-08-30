"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import {
  CaretDown, CaretUp, PaperPlaneTilt, CaretLeft, CaretRight,
  CircleNotch, Paperclip, Lock, X, UserCircle, Quotes,
  CheckSquare, Square, Warning,
} from "@phosphor-icons/react";
import {
  fetchTicketAction,
  replyTicketAction,
  updateTicketStatusAction,
  assignTicketAction,
  getTicketsAction,
  bulkTicketAction,
} from "@/features/admin/actions/support.actions";
import type {
  AdminAgent, AdminTicket, AdminTicketDetail, AdminTicketsResponse,
  Attachment, SupportStats, CannedResponse,
} from "@/features/admin/api/support";
import { supportAdminApiBrowser } from "@/features/admin/api/support/browser";
import { toast } from "@repo/ui/sonner";
import { TICKET_CATEGORY_LABELS } from "@repo/validators";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props {
  initial: AdminTicketsResponse;
  agents: AdminAgent[];
  stats: SupportStats;
  canned: CannedResponse[];
  myAdminId: number;
}

const STATUS_OPTIONS  = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
const CATEGORY_OPTIONS = Object.keys(TICKET_CATEGORY_LABELS) as (keyof typeof TICKET_CATEGORY_LABELS)[];

const STATUS_COLOR: Record<string, string> = {
  open:        "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100 text-gray-500",
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    "text-gray-400",
  medium: "text-blue-500",
  high:   "text-orange-500",
  urgent: "text-red-600 font-semibold",
};

const CATEGORY_COLOR: Record<string, string> = {
  billing:        "bg-purple-50 text-purple-700",
  technical:      "bg-red-50 text-red-700",
  course_content: "bg-blue-50 text-blue-700",
  certificate:    "bg-green-50 text-green-700",
  refund:         "bg-orange-50 text-orange-700",
  other:          "bg-gray-100 text-gray-600",
};

// ── Quick filter presets ──────────────────────────────────────────────────────

type QuickFilter = "all" | "mine" | "unassigned" | "sla" | "open" | "resolved";

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "mine",       label: "Mine" },
  { key: "unassigned", label: "Unassigned" },
  { key: "sla",        label: "⚠ SLA Breach" },
  { key: "open",       label: "Open" },
  { key: "resolved",   label: "Resolved" },
];

function quickFilterToParams(
  qf: QuickFilter,
  myId: number,
): Record<string, string | undefined> {
  switch (qf) {
    case "mine":       return { assignedTo: String(myId) };
    case "unassigned": return { unassigned: "true" };
    case "sla":        return { slaBreach:  "true" };
    case "open":       return { status:     "open" };
    case "resolved":   return { status:     "resolved" };
    default:           return {};
  }
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: SupportStats }) {
  const cards = [
    { label: "Open",        value: stats.open,        color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "In Progress", value: stats.in_progress, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Resolved",    value: stats.resolved,    color: "text-green-600",  bg: "bg-green-50" },
    { label: "Unassigned",  value: stats.unassigned,  color: "text-orange-600", bg: "bg-orange-50" },
    { label: "SLA Breach",  value: stats.sla_breached, color: "text-red-600",   bg: "bg-red-50" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border border-gray-100 ${c.bg} px-4 py-3`}>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="mt-0.5 text-xs font-medium text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Canned response picker ────────────────────────────────────────────────────

function CannedPicker({
  canned,
  onSelect,
}: {
  canned: CannedResponse[];
  onSelect: (body: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = canned.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.body.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Use canned response"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-600"
      >
        <Quotes className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-11 right-0 z-30 w-72 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No templates found</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c.body); setOpen(false); setSearch(""); }}
                className="w-full px-3 py-2.5 text-left hover:bg-brand-50"
              >
                <p className="text-xs font-semibold text-gray-800">{c.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{c.body}</p>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2">
            <a
              href="/admin/support/canned-responses"
              className="text-[11px] text-brand-600 hover:underline"
            >
              Manage templates →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminTicketsClient({ initial, agents, stats: initialStats, canned, myAdminId }: Props) {
  const { formatDate, formatDateTime } = useLocalization();
  const [tickets,    setTickets]    = useState(initial.data);
  const [pagination, setPagination] = useState(initial.pagination);
  const [openTicket, setOpenTicket] = useState<AdminTicketDetail | null>(null);
  const [reply,       setReply]     = useState("");
  const [isInternal,  setIsInternal] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading,   setUploading] = useState(false);

  // Filters
  const [quickFilter,    setQuickFilter]    = useState<QuickFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page,           setPage]           = useState(1);

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAgent, setBulkAgent] = useState<string>("");

  const [stats, setStats]         = useState(initialStats);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load tickets ─────────────────────────────────────────────────────────────

  const load = useCallback(
    (p: number, qf: QuickFilter, cat: string) => {
      startTransition(async () => {
        const extra = quickFilterToParams(qf, myAdminId);
        const res = await getTicketsAction({
          page: p, per_page: 20,
          category: cat || undefined,
          ...Object.fromEntries(
            Object.entries(extra).filter(([, v]) => v !== undefined),
          ) as Record<string, string>,
        });
        if (res.success) {
          setTickets(res.data.data);
          setPagination(res.data.pagination);
          setSelected(new Set());
        }
      });
    },
    [myAdminId],
  );

  function applyQuickFilter(qf: QuickFilter) {
    setQuickFilter(qf); setPage(1); setOpenTicket(null);
    load(1, qf, categoryFilter);
  }

  function handleCategoryFilter(c: string) {
    setCategoryFilter(c); setPage(1); setOpenTicket(null);
    load(1, quickFilter, c);
  }

  function handlePage(p: number) {
    setPage(p); setOpenTicket(null);
    load(p, quickFilter, categoryFilter);
  }

  // ── Ticket actions ────────────────────────────────────────────────────────────

  function handleOpen(id: number) {
    if (openTicket?.id === id) { setOpenTicket(null); return; }
    startTransition(async () => {
      const res = await fetchTicketAction(id);
      if (res.success) {
        setOpenTicket(res.data);
        setReply(""); setIsInternal(false); setPendingAttachments([]);
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, unread: false } : t));
      } else toast.error(res.message ?? "Failed to open ticket");
    });
  }

  function handleStatusChange(id: number, status: typeof STATUS_OPTIONS[number]) {
    startTransition(async () => {
      const res = await updateTicketStatusAction(id, { status });
      if (res.success) {
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
        if (openTicket?.id === id) setOpenTicket((prev) => prev ? { ...prev, status } : prev);
        toast.success(`Ticket marked ${status.replace("_", " ")}`);
      } else toast.error(res.message ?? "Failed to update status");
    });
  }

  function handlePriorityChange(id: number, priority: typeof PRIORITY_OPTIONS[number]) {
    startTransition(async () => {
      const currentStatus = tickets.find((t) => t.id === id)?.status ?? openTicket?.status ?? "open";
      const res = await updateTicketStatusAction(id, {
        status: currentStatus as typeof STATUS_OPTIONS[number], priority,
      });
      if (res.success) {
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, priority } : t));
        if (openTicket?.id === id) setOpenTicket((prev) => prev ? { ...prev, priority } : prev);
        toast.success(`Priority set to ${priority}`);
      } else toast.error(res.message ?? "Failed to update priority");
    });
  }

  function handleAssign(id: number, adminId: number | null) {
    startTransition(async () => {
      const res = await assignTicketAction(id, adminId);
      if (res.success) {
        const agent = agents.find((a) => a.id === adminId);
        const update = {
          assignedTo: adminId,
          assignedAdminFirstName: agent?.firstName ?? null,
          assignedAdminLastName:  agent?.lastName  ?? null,
        };
        setTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...update } : t));
        if (openTicket?.id === id) setOpenTicket((prev) => prev ? { ...prev, ...update } : prev);
        toast.success(adminId ? `Assigned to ${agent?.firstName}` : "Unassigned");
      } else toast.error(res.message ?? "Failed to assign ticket");
    });
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────────

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === tickets.length ? new Set() : new Set(tickets.map((t) => t.id)),
    );
  }

  function handleBulkAction(action: "close" | "resolve" | "assign" | "set_priority", opts: { adminId?: number | null; priority?: string } = {}) {
    const ids = [...selected];
    if (!ids.length) return;
    startTransition(async () => {
      const res = await bulkTicketAction({ ids, action, ...opts });
      if (res.success) {
        toast.success(`${res.data.updated} ticket(s) updated`);
        setSelected(new Set());
        load(page, quickFilter, categoryFilter);
      } else toast.error(res.message ?? "Bulk action failed");
    });
  }

  // ── Reply + file ──────────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !openTicket) return;
    setUploading(true);
    try {
      const urlRes = await supportAdminApiBrowser.attachmentUrl(file.type, file.name);
      const { presignedUrl, publicUrl } = urlRes.data;
      await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setPendingAttachments((prev) => [...prev, { url: publicUrl, name: file.name }]);
      toast.success(`${file.name} attached`);
    } catch {
      toast.error("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleReply() {
    if (!reply.trim() || !openTicket) return;
    startTransition(async () => {
      const res = await replyTicketAction(openTicket.id, {
        message: reply.trim(), isInternal,
        attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      });
      if (res.success) {
        setOpenTicket((prev) => prev ? { ...prev, messages: [...prev.messages, res.data] } : prev);
        setReply(""); setPendingAttachments([]);
        if (!isInternal) {
          setTickets((prev) =>
            prev.map((t) => t.id === openTicket.id ? { ...t, updatedAt: new Date().toISOString(), slaBreach: false } : t),
          );
        }
        toast.success(isInternal ? "Internal note added" : "Reply sent");
      } else toast.error(res.message ?? "Failed to send reply");
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <StatsBar stats={stats} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick filter tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => applyQuickFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                quickFilter === f.key
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        {isPending && <CircleNotch className="h-4 w-4 animate-spin text-brand-500" />}

        <a
          href="/admin/support/canned-responses"
          className="ml-auto text-xs text-brand-600 hover:underline"
        >
          Manage templates
        </a>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-700">{selected.size} selected</span>
          <button
            onClick={() => handleBulkAction("close")}
            disabled={isPending}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >Close</button>
          <button
            onClick={() => handleBulkAction("resolve")}
            disabled={isPending}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >Resolve</button>
          {agents.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={bulkAgent}
                onChange={(e) => setBulkAgent(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Assign to…</option>
                <option value="0">Unassign</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
              </select>
              <button
                onClick={() => {
                  if (bulkAgent === "") return;
                  handleBulkAction("assign", { adminId: bulkAgent === "0" ? null : Number(bulkAgent) });
                  setBulkAgent("");
                }}
                disabled={isPending || !bulkAgent}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >Apply</button>
            </div>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >Clear</button>
        </div>
      )}

      {/* Select-all row */}
      {tickets.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            {selected.size === tickets.length && tickets.length > 0
              ? <CheckSquare className="h-4 w-4 text-brand-600" />
              : <Square className="h-4 w-4" />
            }
            Select all
          </button>
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-3">
        {tickets.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">No tickets</p>
        )}
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              selected.has(ticket.id) ? "border-brand-300" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              {/* Checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(ticket.id); }}
                className="shrink-0 text-gray-300 hover:text-brand-500"
              >
                {selected.has(ticket.id)
                  ? <CheckSquare className="h-4 w-4 text-brand-600" />
                  : <Square className="h-4 w-4" />
                }
              </button>

              {/* Main toggle button */}
              <button
                className="flex flex-1 items-center justify-between gap-3 text-left"
                onClick={() => handleOpen(ticket.id)}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {ticket.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" title="New message" />
                    )}
                    <span className={`truncate text-gray-900 ${ticket.unread ? "font-bold" : "font-medium"}`}>
                      {ticket.subject}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[ticket.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {TICKET_CATEGORY_LABELS[ticket.category as keyof typeof TICKET_CATEGORY_LABELS] ?? ticket.category}
                    </span>
                    <span className={`text-xs ${PRIORITY_COLOR[ticket.priority] ?? "text-gray-400"}`}>
                      {ticket.priority}
                    </span>
                    {ticket.slaBreach && (
                      <span className="animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        ⚠ SLA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{ticket.userFirstName} {ticket.userLastName}</span>
                    <span>·</span>
                    <span>{ticket.createdAt ? formatDate(ticket.createdAt) : ""}</span>
                    {ticket.assignedTo && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-brand-600">
                          <UserCircle className="h-3 w-3" />
                          {ticket.assignedAdminFirstName} {ticket.assignedAdminLastName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {openTicket?.id === ticket.id
                  ? <CaretUp className="h-4 w-4 shrink-0 text-gray-400" />
                  : <CaretDown className="h-4 w-4 shrink-0 text-gray-400" />
                }
              </button>
            </div>

            {/* Expanded view */}
            {openTicket?.id === ticket.id && (
              <div className="space-y-4 border-t border-gray-100 px-5 py-4">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value as typeof STATUS_OPTIONS[number])}
                      disabled={isPending}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Priority:</span>
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(ticket.id, e.target.value as typeof PRIORITY_OPTIONS[number])}
                      disabled={isPending}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {agents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Assign:</span>
                      <select
                        value={ticket.assignedTo ?? ""}
                        onChange={(e) => handleAssign(ticket.id, e.target.value ? Number(e.target.value) : null)}
                        disabled={isPending}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Message thread */}
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {openTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`space-y-1 rounded-xl p-3 ${
                        msg.isInternal ? "border border-amber-200 bg-amber-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-500">
                          {msg.userFirstName} {msg.userLastName}
                          {" · "}
                          {msg.createdAt ? formatDateTime(msg.createdAt) : ""}
                        </p>
                        {msg.isInternal && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <Lock className="h-2.5 w-2.5" /> Internal
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.attachments.map((att) => (
                            <a
                              key={att.url} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50"
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

                {/* Reply area */}
                {ticket.status !== "closed" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsInternal((v) => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          isInternal
                            ? "border border-amber-300 bg-amber-100 text-amber-700"
                            : "border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
                        }`}
                      >
                        <Lock className="h-3 w-3" />
                        {isInternal ? "Internal Note (only staff see this)" : "Internal Note"}
                      </button>
                    </div>

                    {pendingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingAttachments.map((att, i) => (
                          <span key={att.url} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                            <Paperclip className="h-3 w-3 text-gray-400" />
                            {att.name}
                            <button
                              onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                              className="ml-0.5 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={isInternal ? "Write an internal note…" : "Write a reply…"}
                        className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          isInternal ? "border-amber-300 bg-amber-50" : "border-gray-200"
                        }`}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      />
                      <div className="flex flex-col gap-1.5">
                        {/* Canned response picker */}
                        <CannedPicker canned={canned} onSelect={(body) => setReply(body)} />
                        {/* Attachment */}
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          title="Attach file"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
                        >
                          {uploading ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        </button>
                        {/* Send */}
                        <button
                          onClick={handleReply}
                          disabled={isPending || !reply.trim()}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          <PaperPlaneTilt className="h-4 w-4" />
                        </button>
                      </div>
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500">
            Showing {pagination.from}–{pagination.to} of {pagination.total} tickets
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1 || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CaretLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs font-medium text-gray-700">{page} / {pagination.last_page}</span>
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= pagination.last_page || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
