"use client";

import { useState, useTransition, useEffect } from "react";
import {
  MagnifyingGlass,
  User,
  ShieldCheck,
  Clock,
  FunnelSimple,
  ArrowLeft,
  ArrowRight,
  Lightning,
  Database,
  ArrowsClockwise,
  X,
  Tag,
  Hash,
  CalendarBlank,
  Envelope,
  IdentificationCard,
} from "@phosphor-icons/react";
import type { ActivityLogRow, ActivityLogsResponse } from "./types";
import { ACTION_LABELS } from "./types";
import { getActivityLogsAction } from "./actions";
import { useLocalization } from "@/shared/context/LocalizationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string | null, formatDate: (d: string) => string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec <  60)  return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return formatDate(iso);
}

function fullDate(iso: string | null, formatDateTime: (d: string) => string): string {
  if (!iso) return "—";
  return formatDateTime(iso);
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.toLowerCase().replace(/_/g, " ");
}

function actorName(log: ActivityLogRow): string {
  if (log.adminUserId) {
    return `${log.adminFirstName ?? ""} ${log.adminLastName ?? ""}`.trim() || log.adminEmail || "Admin";
  }
  return `${log.userFirstName ?? ""} ${log.userLastName ?? ""}`.trim() || log.userEmail || "User";
}

function actorInitials(log: ActivityLogRow): string {
  const name = actorName(log);
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: ActivityLogRow; onClose: () => void }) {
  const isAdmin = !!log.adminUserId;
  const { formatDateTime } = useLocalization();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const metaEntries = log.meta ? Object.entries(log.meta) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 ${isAdmin ? "bg-brand" : "bg-blue-600"}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                isAdmin ? "bg-white/20 text-white" : "bg-white/20 text-white"
              }`}>
                {actorInitials(log)}
              </div>
              <div>
                <p className="text-white font-semibold text-base leading-tight">{actorName(log)}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${
                  isAdmin ? "bg-white/20 text-white" : "bg-white/20 text-white"
                }`}>
                  {isAdmin ? <ShieldCheck size={10} weight="fill" /> : <User size={10} weight="fill" />}
                  {isAdmin ? (log.adminRole ?? "Admin") : "Student"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Action */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Action</p>
            <div className="flex items-center gap-2">
              <Lightning size={15} weight="fill" className={isAdmin ? "text-brand" : "text-blue-500"} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatAction(log.action)}</span>
              <span className="ml-auto font-mono text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{log.action}</span>
            </div>
          </div>

          {/* Entity */}
          {log.entity && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Entity</p>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-700 dark:text-slate-300 capitalize">{log.entity.replace(/_/g, " ")}</span>
                {log.entityId && (
                  <>
                    <Hash size={12} className="text-gray-300 dark:text-slate-600" />
                    <span className="font-mono text-sm font-semibold text-gray-700 dark:text-slate-300">{log.entityId}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-slate-800" />

          {/* Actor details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Actor</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm">
                <IdentificationCard size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                <span className="text-gray-500 dark:text-slate-400">ID</span>
                <span className="font-mono text-gray-700 dark:text-slate-300 font-medium ml-auto">
                  #{isAdmin ? log.adminUserId : log.userId}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Envelope size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                <span className="text-gray-500 dark:text-slate-400">Email</span>
                <span className="text-gray-700 dark:text-slate-300 ml-auto text-right">
                  {isAdmin ? (log.adminEmail ?? "—") : (log.userEmail ?? "—")}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Timestamp</p>
            <div className="flex items-start gap-2.5">
              <CalendarBlank size={14} className="text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-slate-300">{fullDate(log.createdAt, formatDateTime)}</span>
            </div>
          </div>

          {/* Meta */}
          {metaEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Details</p>
              <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800">
                {metaEntries.map(([key, val]) => (
                  <div key={key} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <span className="text-gray-400 dark:text-slate-500 shrink-0 capitalize min-w-[90px]">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-700 dark:text-slate-300 font-medium break-all ml-auto text-right">
                      {val === null || val === undefined
                        ? <span className="text-gray-300 dark:text-slate-600 italic">null</span>
                        : typeof val === "object"
                        ? <span className="font-mono text-xs bg-gray-50 dark:bg-slate-800 px-1 rounded">{JSON.stringify(val)}</span>
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex-1 min-w-0">
      <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Lightning size={16} weight="fill" className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, onClick }: { log: ActivityLogRow; onClick: () => void }) {
  const isAdmin = !!log.adminUserId;
  const { formatDate } = useLocalization();

  return (
    <div
      className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-gray-50 dark:border-slate-800 last:border-0"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
        isAdmin ? "bg-brand-100 text-brand-700 dark:bg-brand/15 dark:text-brand" : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
      }`}>
        {actorInitials(log)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{actorName(log)}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isAdmin ? "bg-brand-50 text-brand-700 dark:bg-brand/15 dark:text-brand" : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
          }`}>
            {isAdmin ? <ShieldCheck size={10} weight="fill" /> : <User size={10} weight="fill" />}
            {isAdmin ? (log.adminRole ?? "Admin") : "Student"}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mt-0.5">
          {formatAction(log.action)}
          {log.entity && (
            <span className="text-gray-400 dark:text-slate-500"> · <span className="font-mono text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</span></span>
          )}
        </p>
        {log.adminEmail && isAdmin && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{log.adminEmail}</p>
        )}
        {log.userEmail && !isAdmin && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{log.userEmail}</p>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 shrink-0">
        <Clock size={12} />
        <span>{relativeDate(log.createdAt, formatDate)}</span>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

interface Props {
  initial: ActivityLogsResponse;
}

export function ActivityLogsClient({ initial }: Props) {
  const [data, setData]               = useState(initial);
  const [search, setSearch]           = useState("");
  const [actor, setActor]             = useState("");
  const [page, setPage]               = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [isPending, startTransition]  = useTransition();

  function reload(opts: { search?: string; actor?: string; page?: number }) {
    startTransition(async () => {
      const s = opts.search ?? search;
      const a = opts.actor  ?? actor;
      const p = opts.page   ?? page;
      const res = await getActivityLogsAction({ search: s, actor: a, page: p });
      if (res.success) setData(res.data);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    reload({ search: value, page: 1 });
  }

  function handleActor(value: string) {
    setActor(value);
    setPage(1);
    reload({ actor: value, page: 1 });
  }

  function handlePage(p: number) {
    setPage(p);
    reload({ page: p });
  }

  const { data: logs, pagination, stats } = data;

  return (
    <>
      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Full audit trail of admin and student actions</p>
          </div>
          <button
            onClick={() => reload({})}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            <ArrowsClockwise size={15} weight="bold" className={isPending ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-wrap">
          <StatCard label="Total Events"    value={stats.total}        color="bg-brand" />
          <StatCard label="Admin Actions"   value={stats.adminActions} color="bg-indigo-500" />
          <StatCard label="Student Actions" value={stats.userActions}  color="bg-blue-500"   />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/20"
              placeholder="Search actions, entities, names…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <FunnelSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/20 appearance-none"
              value={actor}
              onChange={e => handleActor(e.target.value)}
            >
              <option value="">All actors</option>
              <option value="admin">Admin only</option>
              <option value="user">Students only</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
          {isPending ? (
            <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Database size={36} className="mx-auto mb-3 text-gray-200 dark:text-slate-700" />
              <p className="text-gray-400 dark:text-slate-500 text-sm">No activity logs found</p>
            </div>
          ) : (
            <div>
              {logs.map(log => (
                <LogRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
            <span>
              Showing {pagination.from}–{pagination.to} of {pagination.total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowLeft size={13} /> Prev
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand/15 text-brand-700 dark:text-brand font-medium">
                {page} / {pagination.last_page}
              </span>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => handlePage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                Next <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
