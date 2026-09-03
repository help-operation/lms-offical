"use client";

import { useState } from "react";
import { ChatText, ClockCounterClockwise, EnvelopeSimple, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import {
  getBroadcastJobRecipientsAction,
  searchBroadcastRecipientsAction,
} from "./actions";
import type { BroadcastJob, BroadcastRecipient, RecipientSearchResult } from "./types";

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

const STATUS_BADGE: Record<BroadcastJob["status"], string> = {
  scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  pending: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  running: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

const RECIPIENT_BADGE: Record<BroadcastRecipient["status"], string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  queued: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  sent: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChannelBadge({ channel }: { channel: "sms" | "email" }) {
  return channel === "sms" ? (
    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
      <ChatText size={12} weight="fill" /> SMS
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700 dark:bg-lime-500/15 dark:text-lime-300">
      <EnvelopeSimple size={12} weight="fill" /> Email
    </span>
  );
}

function JobRow({ job }: { job: BroadcastJob }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<BroadcastRecipient[] | null>(null);

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (recipients) return;
    setLoading(true);
    const res = await getBroadcastJobRecipientsAction(job.id);
    setLoading(false);
    if (res.success) setRecipients(res.data);
  }

  const preview = (job.subject || job.message).slice(0, 80);

  return (
    <>
      <tr
        onClick={toggle}
        className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
      >
        <td className="px-3 py-2.5 whitespace-nowrap">
          <ChannelBadge channel={job.channel} />
        </td>
        <td className="max-w-xs truncate px-3 py-2.5 text-gray-700 dark:text-slate-300">
          {preview}
          {(job.subject || job.message).length > 80 ? "…" : ""}
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{job.total}</td>
        <td className="px-3 py-2.5 whitespace-nowrap text-green-600 dark:text-green-400">{job.sent}</td>
        <td className="px-3 py-2.5 whitespace-nowrap text-red-500 dark:text-red-400">{job.failed}</td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_BADGE[job.status]}`}>
            {job.status}
          </span>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDateTime(job.createdAt)}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-50 bg-gray-50/50 last:border-0 dark:border-slate-800/60 dark:bg-slate-800/30">
          <td colSpan={7} className="px-4 py-3">
            {loading ? (
              <p className="text-xs text-gray-400 dark:text-slate-500">Loading recipients…</p>
            ) : recipients && recipients.length > 0 ? (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-400 dark:border-slate-800 dark:text-slate-500">
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Sent to</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 last:border-0 dark:border-slate-800/60">
                        <td className="px-3 py-2 text-gray-700 dark:text-slate-300">
                          {r.firstName} {r.lastName}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{r.recipient}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${RECIPIENT_BADGE[r.status]}`}>
                            {r.status}
                          </span>
                          {r.error && <span className="ml-1.5 text-[10px] text-red-400">{r.error}</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{fmtDateTime(r.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">No recipients found.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function MessageHistoryClient({
  initialJobs,
  loadError,
}: {
  initialJobs: BroadcastJob[];
  loadError: string | null;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RecipientSearchResult[] | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const res = await searchBroadcastRecipientsAction(q);
    setSearching(false);
    if (res.success) setSearchResults(res.data);
  }

  function clearSearch() {
    setQuery("");
    setSearchResults(null);
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
          <ClockCounterClockwise size={18} weight="fill" className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Message History</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Every manual SMS/email broadcast sent from Student Filters, and who received it.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-400">
          <WarningCircle size={16} weight="fill" /> Couldn&apos;t load history: {loadError}
        </div>
      )}

      <form onSubmit={runSearch} className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, phone, or email…"
            className={`w-full pl-8 ${inputCls}`}
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>
        {searchResults && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-sm font-medium text-gray-500 hover:underline dark:text-slate-400"
          >
            Clear
          </button>
        )}
      </form>

      {searchResults ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Channel</th>
                  <th className="px-3 py-2.5">Sent to</th>
                  <th className="px-3 py-2.5">Message</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">When</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 dark:border-slate-800/60">
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <ChannelBadge channel={r.channel} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{r.recipient}</td>
                    <td className="max-w-xs truncate px-3 py-2.5 text-gray-700 dark:text-slate-300">
                      {r.subject || r.message}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${RECIPIENT_BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDateTime(r.createdAt)}</td>
                  </tr>
                ))}
                {searchResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                      No matches for &quot;{query}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                  <th className="px-3 py-2.5">Channel</th>
                  <th className="px-3 py-2.5">Subject / Message</th>
                  <th className="px-3 py-2.5">Total</th>
                  <th className="px-3 py-2.5">Sent</th>
                  <th className="px-3 py-2.5">Failed</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Sent</th>
                </tr>
              </thead>
              <tbody>
                {initialJobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
                {initialJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                      No broadcasts sent yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
            Click a row to see who received it.
          </p>
        </div>
      )}
    </div>
  );
}
