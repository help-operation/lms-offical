"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Calendar, Timer, CheckCircle, XCircle, ArrowsClockwise, SpinnerGap,
  CaretRight, WarningCircle, X,
} from "@phosphor-icons/react";
import { listBroadcastJobsAction, getBroadcastJobRecipientsAction, cancelBroadcastJobAction } from "@/features/broadcast-jobs/actions";
import type { BroadcastJob, BroadcastRecipient } from "@/features/broadcast-jobs/types";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
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

// ── Progress Card ──────────────────────────────────────────────────────────

function ProgressCard({
  job,
  onCancel,
  onViewDetail,
}: {
  job: BroadcastJob;
  onCancel: (id: number) => void;
  onViewDetail: (job: BroadcastJob) => void;
}) {
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [expanded, setExpanded] = useState(false);

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

  const progress = stats.total > 0 ? Math.min(100, Math.round(((stats.sent + stats.failed) / stats.total) * 100)) : 0;
  const isActive = job.status === "running" || job.status === "pending";

  // Auto-refresh for active jobs
  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    async function refresh() {
      const res = await getBroadcastJobRecipientsAction(job.id);
      if (!cancelled && res.success) setRecipients(res.data);
    }
    refresh();
    const iv = setInterval(refresh, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [job.id, isActive]);

  // Load on expand
  useEffect(() => {
    if (expanded && recipients.length === 0) {
      getBroadcastJobRecipientsAction(job.id).then((res) => {
        if (res.success) setRecipients(res.data);
      });
    }
  }, [expanded, job.id, recipients.length]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            job.channel === "sms"
              ? "bg-blue-100 dark:bg-blue-500/15"
              : "bg-purple-100 dark:bg-purple-500/15"
          }`}>
            {job.channel === "sms"
              ? <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">📱</span>
              : <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">📧</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Campaign #{job.id}</h3>
              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${getStatusBadge(job.status)}`}>
                {job.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 max-w-[300px] truncate">{job.message}</p>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">
              Created {formatDate(job.createdAt)}
              {job.adminFirstName && <span className="ml-1">by {job.adminFirstName} {job.adminLastName ?? ""}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {job.scheduledAt && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Calendar size={11} /> {formatDate(job.scheduledAt)}
            </span>
          )}
          {job.intervalSeconds && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Timer size={11} /> Every {job.intervalSeconds}s
            </span>
          )}
          {isActive && (
            <button
              onClick={() => onCancel(job.id)}
              className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onViewDetail(job)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Details
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-slate-400">
            {isActive ? "Sending…" : job.status === "completed" ? "Completed" : job.status}
          </span>
          <span className="text-gray-500 dark:text-slate-400">
            {stats.sent + stats.failed} / {stats.total} · {progress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${job.status === "completed" ? "bg-green-500" : "bg-brand-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle size={11} /> {stats.sent} sent
          </span>
          {stats.delivered > 0 && (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle size={11} weight="fill" /> {stats.delivered} delivered
            </span>
          )}
          {stats.failed > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
              <XCircle size={11} /> {stats.failed} failed
            </span>
          )}
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Clock size={11} /> {stats.pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Expandable recipient list */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-t border-gray-100 px-5 py-2 text-xs text-gray-500 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50"
      >
        <span>{expanded ? "Hide" : "Show"} recipients</span>
        <CaretRight size={12} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="max-h-[250px] overflow-y-auto border-t border-gray-100 dark:border-slate-800">
          {recipients.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">No recipients</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  <th className="px-5 py-2">Student</th>
                  <th className="px-5 py-2">{job.channel === "sms" ? "Phone" : "Email"}</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Sent</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ScheduledMessagesTab() {
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailJob, setDetailJob] = useState<BroadcastJob | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const [scheduled, running, pending] = await Promise.all([
      listBroadcastJobsAction(100, "scheduled"),
      listBroadcastJobsAction(100, "running"),
      listBroadcastJobsAction(100, "pending"),
    ]);
    const all = [
      ...(scheduled.success ? scheduled.data : []),
      ...(running.success ? running.data : []),
      ...(pending.success ? pending.data : []),
    ];
    // Dedupe by id
    const seen = new Set<number>();
    const unique = all.filter((j) => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
    // Sort: running first, then by scheduledAt/createdAt
    unique.sort((a, b) => {
      const order = { running: 0, pending: 1, scheduled: 2 };
      const oa = order[a.status as keyof typeof order] ?? 3;
      const ob = order[b.status as keyof typeof order] ?? 3;
      if (oa !== ob) return oa - ob;
      const da = a.scheduledAt ?? a.createdAt ?? "";
      const db = b.scheduledAt ?? b.createdAt ?? "";
      return da.localeCompare(db);
    });
    setJobs(unique);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-refresh every 5s for active jobs
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "running" || j.status === "pending");
    if (!hasActive) return;
    const iv = setInterval(loadJobs, 5000);
    return () => clearInterval(iv);
  }, [jobs, loadJobs]);

  async function handleCancel(id: number) {
    await cancelBroadcastJobAction(id);
    loadJobs();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scheduled & Active</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Messages queued, scheduled, or currently sending</p>
        </div>
        <button onClick={loadJobs} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <SpinnerGap size={28} className="animate-spin text-brand-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Clock size={32} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-slate-400">No scheduled or active campaigns</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Use Send Message to create a scheduled campaign</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <ProgressCard key={job.id} job={job} onCancel={handleCancel} onViewDetail={setDetailJob} />
          ))}
        </div>
      )}

      {/* Detail modal (reuses MessageHistoryTab's modal pattern inline) */}
      {detailJob && (
        <CampaignDetailMini job={detailJob} onClose={() => setDetailJob(null)} />
      )}
    </div>
  );
}

// ── Inline detail modal for scheduled tab ──────────────────────────────────

function CampaignDetailMini({ job, onClose }: { job: BroadcastJob; onClose: () => void }) {
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getBroadcastJobRecipientsAction(job.id).then((res) => {
      if (!cancelled) { setRecipients(res.data ?? []); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [job.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Campaign #{job.id}</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{formatDate(job.createdAt)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10"><SpinnerGap size={20} className="animate-spin text-brand-500" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  <th className="px-5 py-2">Student</th>
                  <th className="px-5 py-2">{job.channel === "sms" ? "Phone" : "Email"}</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 dark:border-slate-800/60">
                    <td className="px-5 py-2 font-medium text-gray-900 dark:text-white">{r.firstName} {r.lastName}</td>
                    <td className="px-5 py-2 text-gray-500 dark:text-slate-400">{r.recipient}</td>
                    <td className="px-5 py-2">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getRecipientStatusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-2 text-red-500 max-w-[150px] truncate">{r.error ?? "—"}</td>
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
