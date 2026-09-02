"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw, Wallet, MessageSquare, AlertTriangle } from "lucide-react";
import { listBroadcastJobsAction, type BroadcastJob } from "@/features/broadcast-jobs/actions";
import { dashboardApi } from "@/features/admin/dashboard-v2/api";

type Period = "today" | "week" | "month" | "year" | "custom";

interface DateRange {
  from: string;
  to: string;
}

// SMS Pricing (Bangladesh market rates - adjust per your provider)
const SMS_PRICING = {
  english: {
    charsPerSms: 160,
    costPerSms: 0.50, // BDT per SMS
    label: "English (GSM-7)",
  },
  bengali: {
    charsPerSms: 70,
    costPerSms: 1.00, // BDT per SMS (Unicode is 2x)
    label: "Bengali (Unicode)",
  },
};

function isBengali(text: string): boolean {
  // Bengali Unicode range: \u0980-\u09FF
  return /[\u0980-\u09FF]/.test(text);
}

function countSmsParts(text: string): { type: "english" | "bengali"; parts: number; chars: number } {
  const chars = text.length;
  if (isBengali(text)) {
    return { type: "bengali", parts: Math.ceil(chars / SMS_PRICING.bengali.charsPerSms), chars };
  }
  return { type: "english", parts: Math.ceil(chars / SMS_PRICING.english.charsPerSms) || 1, chars };
}

function calculateCost(parts: number, type: "english" | "bengali"): number {
  const pricing = type === "bengali" ? SMS_PRICING.bengali : SMS_PRICING.english;
  return parts * pricing.costPerSms;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400";
}

function getDateRange(period: Period, custom: DateRange): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { from: today, to: now };
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { from: weekStart, to: now };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "custom":
      return {
        from: custom.from ? new Date(custom.from) : today,
        to: custom.to ? new Date(custom.to + "T23:59:59") : now,
      };
  }
}

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500";

// SMS Balance Calculator Component
function SmsBalanceCalculator({ balance }: { balance: number }) {
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState(1);

  const smsInfo = useMemo(() => countSmsParts(message || " "), [message]);
  const costPerMessage = useMemo(() => calculateCost(smsInfo.parts, smsInfo.type), [smsInfo]);
  const totalCost = costPerMessage * recipientCount;
  const totalSmsNeeded = smsInfo.parts * recipientCount;
  const canSend = balance >= totalSmsNeeded;
  const remainingAfterSend = balance - totalSmsNeeded;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/15">
          <Wallet size={16} className="text-brand-600 dark:text-brand-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">SMS Balance & Calculator</h3>
      </div>

      {/* Balance Display */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-3 border border-brand-100/50 dark:from-brand-500/10 dark:to-slate-900 dark:border-brand-500/10">
          <p className="text-[10px] text-gray-500 dark:text-slate-400">Balance</p>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{balance.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">SMS</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-white p-3 border border-green-100/50 dark:from-green-500/10 dark:to-slate-900 dark:border-green-500/10">
          <p className="text-[10px] text-gray-500 dark:text-slate-400">English Rate</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">৳{SMS_PRICING.english.costPerSms}</p>
          <p className="text-[10px] text-gray-400">/SMS (160 chars)</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white p-3 border border-purple-100/50 dark:from-purple-500/10 dark:to-slate-900 dark:border-purple-500/10">
          <p className="text-[10px] text-gray-500 dark:text-slate-400">Bengali Rate</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">৳{SMS_PRICING.bengali.costPerSms}</p>
          <p className="text-[10px] text-gray-400">/SMS (70 chars)</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white p-3 border border-blue-100/50 dark:from-blue-500/10 dark:to-slate-900 dark:border-blue-500/10">
          <p className="text-[10px] text-gray-500 dark:text-slate-400">Can Send</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{balance.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">English SMS</p>
        </div>
      </div>

      {/* Calculator */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Type your SMS message here..."
            className={`w-full resize-none ${inputCls}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">Recipients</label>
            <input
              type="number"
              min={1}
              value={recipientCount}
              onChange={(e) => setRecipientCount(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">Type</label>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
              smsInfo.type === "bengali"
                ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400"
                : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-500/10 dark:text-green-400"
            }`}>
              <MessageSquare size={14} />
              {smsInfo.type === "bengali" ? "Bengali (Unicode)" : "English (GSM-7)"}
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Characters</span>
              <span className="font-medium text-gray-900 dark:text-white">{smsInfo.chars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">SMS Parts</span>
              <span className="font-medium text-gray-900 dark:text-white">{smsInfo.parts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Cost per SMS</span>
              <span className="font-medium text-gray-900 dark:text-white">৳{smsInfo.type === "bengali" ? SMS_PRICING.bengali.costPerSms : SMS_PRICING.english.costPerSms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Total SMS Needed</span>
              <span className="font-medium text-gray-900 dark:text-white">{totalSmsNeeded}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total Cost</span>
                <span className={`font-bold ${canSend ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  ৳{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning/Status */}
        {!canSend && message && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={14} />
            Insufficient balance! Need {totalSmsNeeded} SMS, but only {balance} available.
          </div>
        )}

        {canSend && message && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-800 dark:bg-green-500/10 dark:text-green-400">
            <CheckCircle size={14} />
            After sending: {remainingAfterSend.toLocaleString()} SMS remaining (৳{(remainingAfterSend * (smsInfo.type === "bengali" ? SMS_PRICING.bengali.costPerSms : SMS_PRICING.english.costPerSms)).toFixed(2)} balance)
          </div>
        )}
      </div>
    </div>
  );
}

export function SmsHistoryTab() {
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [customDate, setCustomDate] = useState<DateRange>({ from: "", to: "" });
  const [smsBalance, setSmsBalance] = useState(0);

  async function loadJobs() {
    setLoading(true);
    const [jobsRes, commRes] = await Promise.all([
      listBroadcastJobsAction(500),
      dashboardApi.communication().catch(() => null),
    ]);
    
    if (commRes?.data?.sms?.balance !== undefined) {
      setSmsBalance(commRes.data.sms.balance);
    }
    
    if (jobsRes.success) {
      const smsJobs = jobsRes.data.filter((j) => j.channel === "sms");
      const range = getDateRange(period, customDate);
      const filtered = smsJobs.filter((j) => {
        if (!j.createdAt) return false;
        const d = new Date(j.createdAt);
        return d >= range.from && d <= range.to;
      });
      setJobs(filtered);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
  }, [period, customDate]);

  const totalSent = jobs.reduce((sum, j) => sum + j.sent, 0);
  const totalFailed = jobs.reduce((sum, j) => sum + j.failed, 0);
  const totalRecipients = jobs.reduce((sum, j) => sum + j.total, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">SMS History</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">All SMS broadcasts sent from your account</p>
        </div>
        <button
          onClick={loadJobs}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* SMS Balance Calculator */}
      <SmsBalanceCalculator balance={smsBalance} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-4 border border-brand-100/50 dark:from-brand-500/10 dark:to-slate-900 dark:border-brand-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-white p-4 border border-blue-100/50 dark:from-blue-500/10 dark:to-slate-900 dark:border-blue-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Recipients</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRecipients.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-white p-4 border border-green-100/50 dark:from-green-500/10 dark:to-slate-900 dark:border-green-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Sent</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-white p-4 border border-red-100/50 dark:from-red-500/10 dark:to-slate-900 dark:border-red-500/10">
          <p className="text-xs text-gray-500 dark:text-slate-400">Failed</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalFailed.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500">
          <Calendar size={14} /> Period:
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
            <input
              type="date"
              value={customDate.from}
              onChange={(e) => setCustomDate((prev) => ({ ...prev, from: e.target.value }))}
              className={inputCls}
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customDate.to}
              onChange={(e) => setCustomDate((prev) => ({ ...prev, to: e.target.value }))}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">No SMS broadcasts found for this period</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-xs text-gray-400 dark:text-slate-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{job.id}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
