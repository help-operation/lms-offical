"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, ArrowsClockwise, DeviceMobile, Envelope,
  CaretRight, SpinnerGap, X, MagnifyingGlass, Download, Eye, ArrowClockwise,
  WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import {
  getMessageHistoryAction,
  getMessageDetailAction,
  resendMessageAction,
  exportMessageHistoryAction,
} from "@/features/broadcast-jobs/actions";
import type { MessageHistoryRow, MessageDetail, MessageHistoryResponse } from "@/features/broadcast-jobs/types";

type StatusFilter = "all" | "pending" | "queued" | "sent" | "delivered" | "failed" | "scheduled" | "cancelled";
type ChannelFilter = "all" | "sms" | "email";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    queued: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400";
}

function getChannelBadge(channel: string) {
  return channel === "sms"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
    : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400";
}

const PAGE_SIZE = 25;

// ── Message Detail Modal ────────────────────────────────────────────────────

function MessageDetailModal({
  recipientId,
  onClose,
}: {
  recipientId: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMessageDetailAction(recipientId).then((res) => {
      if (!cancelled) {
        if (res.success) setDetail(res.data);
        else toast.error(res.message);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [recipientId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="flex items-center justify-center p-10" onClick={(e) => e.stopPropagation()}>
          <SpinnerGap size={24} className="animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const sentByName = detail.adminFirstName
    ? `${detail.adminFirstName} ${detail.adminLastName ?? ""}`
    : "System";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Message Details</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              To {detail.firstName} {detail.lastName} ({detail.recipient})
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusBadge(detail.status)}`}>
              {detail.status}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${getChannelBadge(detail.channel)}`}>
              {detail.channel === "sms" ? <DeviceMobile size={10} /> : <Envelope size={10} />}
              {detail.channel.toUpperCase()}
            </span>
          </div>

          {/* Audit trail */}
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800/50 space-y-2 text-xs">
            <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Audit Trail</h4>
            <AuditRow label="Created" value={`${formatDate(detail.createdAt)} ${formatTime(detail.createdAt)}`} />
            <AuditRow label="Sent By" value={sentByName} />
            <AuditRow label="Sent At" value={detail.sentAt ? `${formatDate(detail.sentAt)} ${formatTime(detail.sentAt)}` : "—"} />
            <AuditRow label="Delivered At" value={detail.deliveredAt ? `${formatDate(detail.deliveredAt)} ${formatTime(detail.deliveredAt)}` : "—"} />
            <AuditRow label="Recipient" value={`${detail.firstName} ${detail.lastName} · ${detail.recipient}`} />
            {detail.jobScheduledAt && <AuditRow label="Scheduled" value={`${formatDate(detail.jobScheduledAt)} ${formatTime(detail.jobScheduledAt)}`} />}
            {detail.jobIntervalSeconds && <AuditRow label="Interval" value={`Every ${detail.jobIntervalSeconds}s`} />}
          </div>

          {/* Message content */}
          <div>
            <h4 className="mb-1 text-xs font-semibold text-gray-700 dark:text-slate-300">Message</h4>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 whitespace-pre-wrap dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              {detail.renderedMessage || detail.message}
            </div>
          </div>

          {/* Error */}
          {detail.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400">
              <WarningCircle size={12} className="mr-1 inline" />
              <strong>Error:</strong> {detail.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// ── Resend Confirmation Modal ───────────────────────────────────────────────

function ResendModal({
  row,
  onConfirm,
  onClose,
}: {
  row: MessageHistoryRow;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    const res = await resendMessageAction(row.id);
    setSending(false);
    if (res.success) {
      toast.success("Message resent successfully");
      onConfirm();
    } else {
      toast.error(res.message);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Resend Message</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
          Resend this message to <strong>{row.firstName} {row.lastName}</strong> ({row.recipient})?
        </p>
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          {row.renderedMessage?.substring(0, 150) ?? row.message?.substring(0, 150)}…
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleResend}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {sending ? <SpinnerGap size={12} className="animate-spin" /> : <ArrowClockwise size={12} />}
            {sending ? "Sending…" : "Yes, resend"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function MessageHistoryTab() {
  const [data, setData] = useState<MessageHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [detailId, setDetailId] = useState<number | null>(null);
  const [resendRow, setResendRow] = useState<MessageHistoryRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const res = await getMessageHistoryAction({
      limit: PAGE_SIZE,
      offset,
      status: statusFilter,
      channel: channelFilter,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    if (res.success) setData(res.data);
    setLoading(false);
  }, [page, statusFilter, channelFilter, search, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [statusFilter, channelFilter, search, dateFrom, dateTo]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  async function handleExport() {
    const res = await exportMessageHistoryAction({
      channel: channelFilter,
      status: statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    if (!res.success) { toast.error(res.message); return; }

    // Build CSV
    const headers = ["ID", "Recipient", "Name", "Channel", "Status", "Message", "Sent By", "Sent At", "Delivered At", "Error", "Created At"];
    const rows = res.data.map((r: any) => [
      r.id, r.recipient, `${r.firstName} ${r.lastName}`, r.channel, r.status,
      (r.renderedMessage || r.message || "").replace(/"/g, '""'),
      r.adminFirstName ? `${r.adminFirstName} ${r.adminLastName ?? ""}` : "System",
      r.sentAt ?? "", r.deliveredAt ?? "", r.error ?? "", r.createdAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Message History</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Complete delivery log for all SMS and Email messages
            {data && <span className="ml-1 font-medium text-gray-700 dark:text-slate-300">· {data.total.toLocaleString()} total</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <Download size={13} /> Export
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <ArrowsClockwise size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 outline-none focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-slate-800">
          {(["all", "sms", "email"] as ChannelFilter[]).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                channelFilter === ch
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              {ch === "sms" ? <DeviceMobile size={10} /> : ch === "email" ? <Envelope size={10} /> : null}
              {ch === "all" ? "All" : ch.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <span className="text-[10px] text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerGap size={24} className="animate-spin text-brand-500" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">No messages found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    <th className="px-4 py-3 font-medium">Recipient</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Message</th>
                    <th className="px-4 py-3 font-medium">Sent By</th>
                    <th className="px-4 py-3 font-medium">Sent</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{row.firstName} {row.lastName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">{row.recipient}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${getChannelBadge(row.channel)}`}>
                          {row.channel === "sms" ? <DeviceMobile size={9} /> : <Envelope size={9} />}
                          {row.channel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-gray-600 dark:text-slate-400">{row.renderedMessage || row.message}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                        {row.adminFirstName ? `${row.adminFirstName} ${row.adminLastName ?? ""}` : "System"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">{formatDate(row.sentAt || row.createdAt)}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">{formatTime(row.sentAt || row.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(row.status)}`}>
                          {row.status}
                        </span>
                        {row.error && (
                          <p className="mt-1 max-w-[120px] truncate text-[10px] text-red-500" title={row.error}>{row.error}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailId(row.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-slate-800"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          {row.status === "failed" && (
                            <button
                              onClick={() => setResendRow(row)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                              title="Resend"
                            >
                              <ArrowClockwise size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-xs text-gray-500 dark:text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {detailId && <MessageDetailModal recipientId={detailId} onClose={() => setDetailId(null)} />}
      {resendRow && (
        <ResendModal
          row={resendRow}
          onConfirm={fetchData}
          onClose={() => setResendRow(null)}
        />
      )}
    </div>
  );
}
