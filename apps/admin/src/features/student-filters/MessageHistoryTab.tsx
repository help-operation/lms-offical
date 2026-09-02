"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, ArrowsClockwise, DeviceMobile, Envelope,
  CaretDown, CaretRight, WarningCircle, SpinnerGap, X, Users,
} from "@phosphor-icons/react";
import { listBroadcastJobsAction, getBroadcastJobRecipientsAction, cancelBroadcastJobAction } from "@/features/broadcast-jobs/actions";
import type { BroadcastJob, BroadcastRecipient } from "@/features/broadcast-jobs/types";

type Period = "today" | "week" | "month" | "year" | "custom";
type ChannelFilter = "all" | "sms" | "email";

interface DateRange {
  from: string;
  to: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    queued: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400";
}

function getRecipientStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    queued: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400";
}

function getDateRange(period: Period, custom: DateRange): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "today": return { from: today, to: now };
    case "week": {
      const d = new Date(today); d.setDate(today.getDate() - today.getDay());
      return { from: d, to: now };
    }
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "year": return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "custom": return {
      from: custom.from ? new Date(custom.from) : today,
      to: custom.to ? new Date(custom.to + "T23:59:59") : now,
    };
  }
}

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500";

// ── Campaign Detail Modal ────────────────────────────────────────────────────

function CampaignDetailModal({
  job,
  onClose,
}: {
  job: BroadcastJob;
  onClose: () => void;
}) {
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await getBroadcastJobRecipientsAction(job.id);
      if (!cancelled) {
        if (res.success) setRecipients(res.data);
        else setError(res.message);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [job.id]);

  // Real-time refresh for running jobs
  useEffect(() => {
    if (job.status !== "running" && job.status !== "pending") return;
    const iv = setInterval(async () => {
      const res = await getBroadcastJobRecipientsAction(job.id);
      if (res.success) setRecipients(res.data);
    }, 3000);
    return () => clearInterval(iv);
  }, [job.id, job.status]);

  const stats = useMemo(() => {
    const s = { sent: 0, failed: 0, pending: 0, delivered: 0, total: recipients.length };
    for (const r of recipients) {
      if (r.status === "sent" || r.status === "delivered") s.sent++;
      if (r.status === "failed") s.failed++;
      if (r.status === "pending" || r.status === "queued") s.pending++;
      if (r.status === "delivered") s.delivered++;
    }
    return s;
  }, [recipients]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Campaign #{job.id}
              <span className={`ml-2 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${getStatusBadge(job.status)}`}>
                {job.status}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              {job.channel === "sms" ? "📱 SMS" : "📧 Email"} · {formatDate(job.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Message preview */}
        <div className="border-b border-gray-100 px-5 py-3 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Message</p>
          <p className="mt-1 line-clamp-3 text-xs text-gray-600 dark:text-slate-300">{job.message}</p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-3 dark:border-slate-800">
          <StatPill icon={<Users size={12} />} label="Total" value={stats.total} color="gray" />
          <StatPill icon={<CheckCircle size={12} />} label="Sent" value={stats.sent} color="green" />
          <StatPill icon={<XCircle size={12} />} label="Failed" value={stats.failed} color="red" />
          <StatPill icon={<Clock size={12} />} label="Pending" value={stats.pending} color="yellow" />
          {stats.delivered > 0 && <StatPill icon={<CheckCircle size={12} weight="fill" />} label="Delivered" value={stats.delivered} color="green" />}
        </div>

        {/* Recipients table */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <SpinnerGap size={20} className="animate-spin text-brand-500" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-500">{error}</div>
          ) : recipients.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No recipients</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  <th className="px-5 py-2">Student</th>
                  <th className="px-5 py-2">{job.channel === "sms" ? "Phone" : "Email"}</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Sent</th>
                  <th className="px-5 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 dark:border-slate-800/60">
                    <td className="px-5 py-2 font-medium text-gray-900 dark:text-white">{r.firstName} {r.lastName}</td>
                    <td className="px-5 py-2 text-gray-500 dark:text-slate-400">{r.recipient}</td>
                    <td className="px-5 py-2">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getRecipientStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-gray-500 dark:text-slate-400">{r.sentAt ? formatDate(r.sentAt) : "—"}</td>
                    <td className="px-5 py-2 text-red-500 dark:text-red-400 max-w-[150px] truncate">{r.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    gray: "text-gray-600 dark:text-slate-300",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colors[color] ?? colors.gray}`}>
      {icon} <span className="font-semibold">{value}</span> <span className="text-gray-400 dark:text-slate-500">{label}</span>
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function MessageHistoryTab() {
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [customDate, setCustomDate] = useState<DateRange>({ from: "", to: "" });
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [selectedJob, setSelectedJob] = useState<BroadcastJob | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const res = await listBroadcastJobsAction(500);
    if (res.success) setJobs(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "running" || j.status === "pending");
    if (!hasRunning) return;
    const iv = setInterval(loadJobs, 5000);
    return () => clearInterval(iv);
  }, [jobs, loadJobs]);

  const filtered = useMemo(() => {
    const range = getDateRange(period, customDate);
    return jobs.filter((j) => {
      if (channelFilter !== "all" && j.channel !== channelFilter) return false;
      if (j.createdAt) {
        const d = new Date(j.createdAt);
        if (d < range.from || d > range.to) return false;
      }
      return true;
    });
  }, [jobs, period, customDate, channelFilter]);

  const stats = useMemo(() => {
    let totalSent = 0, totalFailed = 0, totalRecipients = 0, totalJobs = filtered.length;
    for (const j of filtered) {
      totalSent += j.sent;
      totalFailed += j.failed;
      totalRecipients += j.total;
    }
    return { totalJobs, totalSent, totalFailed, totalRecipients };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Message History</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">All SMS and Email broadcasts sent from your account</p>
        </div>
        <button onClick={loadJobs} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-4 border border-brand-100/50 dark:from-brand-500/10 dark:to-slate-900 dark:border-brand-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Total Campaigns</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalJobs}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white p-4 border border-blue-100/50 dark:from-blue-500/10 dark:to-slate-900 dark:border-blue-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Recipients</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecipients.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-white p-4 border border-green-100/50 dark:from-green-500/10 dark:to-slate-900 dark:border-green-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Sent</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-white p-4 border border-red-100/50 dark:from-red-500/10 dark:to-slate-900 dark:border-red-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Failed</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalFailed.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Channel filter */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-slate-800">
          {([
            ["all", "All", null],
            ["sms", "SMS", DeviceMobile],
            ["email", "Email", Envelope],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setChannelFilter(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                channelFilter === value
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              {Icon && <Icon size={12} />}
              {label}
            </button>
          ))}
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500">
          <Calendar size={14} />
        </div>
        {(["today", "week", "month", "year", "custom"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            {p === "custom" ? "Custom" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customDate.from} onChange={(e) => setCustomDate((prev) => ({ ...prev, from: e.target.value }))} className={inputCls} />
            <span className="text-gray-400">to</span>
            <input type="date" value={customDate.to} onChange={(e) => setCustomDate((prev) => ({ ...prev, to: e.target.value }))} className={inputCls} />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <SpinnerGap size={24} className="animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">No campaigns found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-xs text-gray-400 dark:text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{job.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                      job.channel === "sms"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400"
                    }`}>
                      {job.channel === "sms" ? <DeviceMobile size={10} /> : <Envelope size={10} />}
                      {job.channel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 max-w-[200px] truncate">{job.message}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{job.total}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={12} /> {job.sent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 ${job.failed > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}>
                      <XCircle size={12} /> {job.failed}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{formatDate(job.createdAt)}</td>
                  <td className="px-4 py-3">
                    <CaretRight size={14} className="text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Campaign detail modal */}
      {selectedJob && <CampaignDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
