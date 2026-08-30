"use client";

import { useState, useTransition } from "react";
import {
  X,
  MagnifyingGlass,
  SpinnerGap,
  Trash,
  PauseCircle,
  PlayCircle,
  CalendarBlank,
  Warning,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import {
  searchEnrollUsersAction,
  getStudentEnrollmentsAction,
  removeRecordedEnrollmentAction,
  removeLiveEnrollmentAction,
  toggleRecordedSuspendAction,
  toggleLiveSuspendAction,
  setRecordedExpiryAction,
  setLiveExpiryAction,
  getEnrollmentPaymentsAction,
  recordEnrollmentPaymentAction,
} from "./actions";
import type { EnrollUser, StudentEnrollmentsData, StudentEnrollmentEntry, EnrollmentPaymentRecord } from "./types";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { useLocalization } from "@/shared/context/LocalizationContext";

type Tab = "remove" | "suspend" | "expiry" | "payment";

const TAB_LABELS: Record<Tab, string> = {
  remove:  "Remove Access",
  suspend: "Suspend / Unsuspend",
  expiry:  "Set Expiry",
  payment: "Payment",
};

export function ManageEnrollmentModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<Tab>("remove");
  const { formatDate } = useLocalization();

  // ── Student search ──────────────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [results, setResults]         = useState<EnrollUser[]>([]);
  const [searching, setSearching]     = useState(false);
  const [selected, setSelected]       = useState<EnrollUser | null>(null);
  const [enrollData, setEnrollData]   = useState<StudentEnrollmentsData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [isPending, startTransition]  = useTransition();

  // ── Expiry local state ──────────────────────────────────────────────────────
  const [expiryEdits, setExpiryEdits] = useState<Record<string, string>>({});

  // ── Suspend reason local state ───────────────────────────────────────────────
  const [reasonEdits, setReasonEdits] = useState<Record<string, string>>({});

  // ── Payment local state ──────────────────────────────────────────────────────
  const [paymentAmountEdits, setPaymentAmountEdits] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({});
  const [historyData, setHistoryData] = useState<Record<string, EnrollmentPaymentRecord[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});

  async function doSearch(q: string) {
    setSearch(q);
    setSearching(true);
    const r = await searchEnrollUsersAction(q);
    if (r.success) setResults(r.data);
    setSearching(false);
  }

  async function selectUser(u: EnrollUser) {
    setSelected(u);
    setResults([]);
    setSearch("");
    setLoading(true);
    const r = await getStudentEnrollmentsAction(u.id);
    setLoading(false);
    if (r.success) {
      setEnrollData(r.data);
      // Seed expiry edit fields from current values
      const edits: Record<string, string> = {};
      for (const enr of r.data.enrollments) {
        const key = `${enr.courseType}-${enr.id}`;
        edits[key] = enr.expiresAt ? enr.expiresAt.slice(0, 10) : "";
      }
      setExpiryEdits(edits);
    } else {
      toast.error(r.message ?? "Failed to load enrollments");
    }
  }

  function clearUser() {
    setSelected(null);
    setEnrollData(null);
    setExpiryEdits({});
  }

  function refreshEnrollments() {
    if (selected) selectUser(selected);
    onChanged();
  }

  // ── Remove ──────────────────────────────────────────────────────────────────
  function removeEnrollment(enr: StudentEnrollmentEntry) {
    startTransition(async () => {
      const fn = enr.courseType === "recorded" ? removeRecordedEnrollmentAction : removeLiveEnrollmentAction;
      const r = await fn(enr.id);
      if (r.success) {
        toast.success(`Access removed for "${enr.courseTitle}"`);
        refreshEnrollments();
      } else {
        toast.error(r.message ?? "Failed to remove");
      }
    });
  }

  // ── Suspend ─────────────────────────────────────────────────────────────────
  function toggleSuspend(enr: StudentEnrollmentEntry) {
    const key = `${enr.courseType}-${enr.id}`;
    const reason = reasonEdits[key];
    startTransition(async () => {
      const fn = enr.courseType === "recorded" ? toggleRecordedSuspendAction : toggleLiveSuspendAction;
      const r = await fn(enr.id, reason);
      if (r.success) {
        const action = r.data.status === "suspended" ? "suspended" : "unsuspended";
        toast.success(`Enrollment ${action} for "${enr.courseTitle}"`);
        refreshEnrollments();
      } else {
        toast.error(r.message ?? "Failed to update status");
      }
    });
  }

  // ── Expiry ──────────────────────────────────────────────────────────────────
  function saveExpiry(enr: StudentEnrollmentEntry) {
    const key = `${enr.courseType}-${enr.id}`;
    const val = expiryEdits[key] ?? "";
    const expiresAt = val ? new Date(val).toISOString() : null;

    startTransition(async () => {
      const fn = enr.courseType === "recorded" ? setRecordedExpiryAction : setLiveExpiryAction;
      const r = await fn(enr.id, expiresAt);
      if (r.success) {
        toast.success(expiresAt ? `Expiry set for "${enr.courseTitle}"` : `Expiry cleared for "${enr.courseTitle}"`);
        refreshEnrollments();
      } else {
        toast.error(r.message ?? "Failed to set expiry");
      }
    });
  }

  // ── Payment ─────────────────────────────────────────────────────────────────
  function recordPayment(enr: StudentEnrollmentEntry) {
    const key = `${enr.courseType}-${enr.id}`;
    const raw = paymentAmountEdits[key];
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    startTransition(async () => {
      const r = await recordEnrollmentPaymentAction(enr.courseType, enr.id, { amount: value });
      if (r.success) {
        toast.success(`Payment recorded for "${enr.courseTitle}"`);
        setPaymentAmountEdits((prev) => ({ ...prev, [key]: "" }));
        setHistoryData((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        refreshEnrollments();
      } else {
        toast.error(r.message ?? "Failed to record payment");
      }
    });
  }

  async function toggleHistory(enr: StudentEnrollmentEntry) {
    const key = `${enr.courseType}-${enr.id}`;
    const willOpen = !historyOpen[key];
    setHistoryOpen((prev) => ({ ...prev, [key]: willOpen }));
    if (willOpen && !historyData[key]) {
      setHistoryLoading((prev) => ({ ...prev, [key]: true }));
      const r = await getEnrollmentPaymentsAction(enr.courseType, enr.id);
      setHistoryLoading((prev) => ({ ...prev, [key]: false }));
      if (r.success) setHistoryData((prev) => ({ ...prev, [key]: r.data.payments }));
      else toast.error(r.message ?? "Failed to load payment history");
    }
  }

  const enrollments = enrollData?.enrollments ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Manage Enrollment</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Remove access, suspend, or set expiry for a student's enrollment.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* ── Student picker — outside scroll so the dropdown isn't clipped ── */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">Student</h3>

          {selected ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 dark:border-brand/30 bg-brand-50 dark:bg-brand/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {selected.firstName} {selected.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {selected.email ?? selected.phone ?? "—"}
                </p>
              </div>
              <button
                onClick={clearUser}
                className="text-xs font-semibold text-brand-600 dark:text-brand hover:underline shrink-0 ml-3"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => doSearch(e.target.value)}
                placeholder="Search student by name, email or phone"
                className="input-base w-full pl-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                autoFocus
              />
              {(searching || results.length > 0) && (
                <div className="absolute top-full left-0 z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-gray-50 dark:divide-slate-800">
                  {searching ? (
                    <p className="px-3 py-3 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2">
                      <SpinnerGap size={13} className="animate-spin" /> Searching…
                    </p>
                  ) : results.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-gray-400 dark:text-slate-500">No users found.</p>
                  ) : (
                    results.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center justify-between gap-2"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-slate-500 truncate">
                            {u.email ?? u.phone ?? "—"}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 shrink-0">
                          {u.role}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {!selected && (
              <div className="flex flex-col items-center py-12 text-gray-300 dark:text-slate-700 gap-2">
                <MagnifyingGlass size={32} weight="thin" />
                <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Search for a student above</p>
              </div>
            )}

            {/* ── Tabs ── */}
            {selected && (
              <>
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                  {(["remove", "suspend", "expiry", "payment"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${
                        tab === t
                          ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>

                {/* ── Content ── */}
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <SpinnerGap size={24} className="animate-spin text-brand-500 dark:text-brand" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400 dark:text-slate-500 gap-2">
                    <p className="text-sm font-medium">No enrollments found</p>
                    <p className="text-xs">This student has no course enrollments.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enr) => {
                      const key = `${enr.courseType}-${enr.id}`;
                      const isSuspended = enr.status === "suspended";
                      const expiryKey = key;
                      const currentExpiry = expiryEdits[expiryKey] ?? "";
                      const originalExpiry = enr.expiresAt ? enr.expiresAt.slice(0, 10) : "";
                      const expiryChanged = currentExpiry !== originalExpiry;

                      if (tab === "payment") {
                        const history = historyData[key];
                        const isOpen = historyOpen[key];
                        return (
                          <div
                            key={key}
                            className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 px-4 py-3 space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {enr.courseTitle}
                                  </p>
                                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                                    enr.courseType === "live"
                                      ? "bg-brand-100 dark:bg-brand/15 text-brand-600 dark:text-brand"
                                      : "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                  }`}>
                                    {enr.courseType}
                                  </span>
                                </div>
                                {enr.paymentStatus ? (
                                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                                    Fee ৳{Number(enr.feeAmount).toLocaleString()} · Paid ৳{Number(enr.totalPaid).toLocaleString()} · Due ৳{Number(enr.dueAmount).toLocaleString()}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Free enrollment — no invoice yet</p>
                                )}
                              </div>
                              {enr.paymentStatus && <PaymentStatusBadge status={enr.paymentStatus} />}
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={paymentAmountEdits[key] ?? ""}
                                onChange={(e) => setPaymentAmountEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                placeholder="Amount received (৳)"
                                disabled={isPending}
                                className="flex-1 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand/30 focus:border-transparent"
                              />
                              <button
                                disabled={isPending}
                                onClick={() => recordPayment(enr)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover text-white transition disabled:opacity-40"
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => toggleHistory(enr)}
                                className="text-[11px] font-semibold text-brand-600 dark:text-brand hover:underline shrink-0"
                              >
                                {isOpen ? "Hide history" : "View history"}
                              </button>
                            </div>

                            {isOpen && (
                              <div className="rounded-lg border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-gray-50 dark:divide-slate-800">
                                {historyLoading[key] ? (
                                  <p className="px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2">
                                    <SpinnerGap size={13} className="animate-spin" /> Loading…
                                  </p>
                                ) : !history || history.length === 0 ? (
                                  <p className="px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500">No payments recorded yet.</p>
                                ) : (
                                  history.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs">
                                      <span className="text-gray-700 dark:text-slate-300">
                                        ৳{Number(p.amount).toLocaleString()} · {p.method}
                                        {p.status !== "completed" && <span className="ml-1 text-amber-500">({p.status})</span>}
                                      </span>
                                      <span className="text-gray-400 dark:text-slate-500">
                                        {p.paidAt ? formatDate(p.paidAt) : p.createdAt ? formatDate(p.createdAt) : "—"}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 px-4 py-3"
                        >
                          {/* Course info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {enr.courseTitle}
                              </p>
                              <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                                enr.courseType === "live"
                                  ? "bg-brand-100 dark:bg-brand/15 text-brand-600 dark:text-brand"
                                  : "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              }`}>
                                {enr.courseType}
                              </span>
                              {isSuspended && (
                                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 uppercase tracking-wide">
                                  suspended
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                              Enrolled: {enr.enrolledAt ? formatDate(enr.enrolledAt) : "—"}
                              {enr.expiresAt && (
                                <> · Expires: <span className="text-amber-600 dark:text-amber-400">{formatDate(enr.expiresAt)}</span></>
                              )}
                            </p>
                            {tab === "suspend" && isSuspended && enr.statusReason && (
                              <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">
                                Reason: {enr.statusReason}
                              </p>
                            )}
                            {tab === "suspend" && !isSuspended && (
                              <input
                                type="text"
                                value={reasonEdits[key] ?? ""}
                                onChange={(e) => setReasonEdits((p) => ({ ...p, [key]: e.target.value }))}
                                placeholder="Reason shown to the student (optional)"
                                disabled={isPending}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-gray-700 dark:text-slate-300 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                            )}
                          </div>

                          {/* Tab-specific action */}
                          {tab === "remove" && (
                            <ConfirmButton
                              label="Remove"
                              icon={<Trash size={13} weight="bold" />}
                              className="bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25"
                              disabled={isPending}
                              onConfirm={() => removeEnrollment(enr)}
                            />
                          )}

                          {tab === "suspend" && (
                            <button
                              disabled={isPending}
                              onClick={() => toggleSuspend(enr)}
                              className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                isSuspended
                                  ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/25"
                                  : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/25"
                              }`}
                            >
                              {isSuspended
                                ? <><PlayCircle size={13} weight="fill" /> Unsuspend</>
                                : <><PauseCircle size={13} weight="fill" /> Suspend</>
                              }
                            </button>
                          )}

                          {tab === "expiry" && (
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="date"
                                value={currentExpiry}
                                onChange={(e) =>
                                  setExpiryEdits((prev) => ({ ...prev, [expiryKey]: e.target.value }))
                                }
                                className="text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand/30 focus:border-transparent"
                              />
                              {currentExpiry && (
                                <button
                                  onClick={() =>
                                    setExpiryEdits((prev) => ({ ...prev, [expiryKey]: "" }))
                                  }
                                  className="text-[10px] text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition"
                                  title="Clear expiry"
                                >
                                  ✕
                                </button>
                              )}
                              <button
                                disabled={isPending || !expiryChanged}
                                onClick={() => saveExpiry(enr)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover text-white transition disabled:opacity-40"
                              >
                                <CalendarBlank size={12} weight="bold" />
                                Save
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Button ────────────────────────────────────────────────────────────
// Two-click confirm to prevent accidental deletions.

function ConfirmButton({
  label,
  icon,
  className,
  disabled,
  onConfirm,
}: {
  label: string;
  icon: React.ReactNode;
  className: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold">
          <Warning size={13} weight="fill" /> Sure?
        </span>
        <button
          disabled={disabled}
          onClick={() => { setConfirming(false); onConfirm(); }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
        >
          Yes, remove
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={disabled}
      onClick={() => setConfirming(true)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 shrink-0 ${className}`}
    >
      {icon} {label}
    </button>
  );
}
