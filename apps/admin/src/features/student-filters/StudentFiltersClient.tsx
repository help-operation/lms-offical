"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Funnel,
  PaperPlaneTilt,
  SpinnerGap,
  X,
  ArrowClockwise,
  Users,
  WarningCircle,
  CaretDoubleLeft,
  CaretLeft,
  CaretRight,
  CaretDoubleRight,
  MagnifyingGlass,
  Envelope,
  DeviceMobile,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { Student } from "@/features/students/types";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { sendSmsToStudentsAction, sendEmailToStudentsAction, type EnrollmentSummaryRow } from "./actions";
import { getBroadcastJobAction } from "@/features/broadcast-jobs/actions";
import { enrichStudent } from "./enrichment";
import { EMPTY_FILTERS, type EnrichedStudent, type Filters } from "./types";
import { SmsHistoryTab } from "./SmsHistoryTab";
import { EmailHistoryTab } from "./EmailHistoryTab";

type ActiveTab = "students" | "sms" | "email";

// Only variables the backend can genuinely fill per-recipient right now —
// see sms-broadcast.service.ts#sendToStudentIds. due_amount/payment_link/
// class_date/class_time have no real data source yet (no due-amount
// tracking, no live-class linkage on this send flow).
const RESOLVABLE_VARS = new Set(["{{student_name}}", "{{name}}", "{{course_name}}", "{{course_title}}", "{{batch_name}}", "{{site_name}}"]);

function parseTemplateVars(json: string): { key: string; description: string }[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** {{...}} placeholders in the message that the backend won't fill — would send literally. */
function findUnresolvedVars(message: string): string[] {
  const matches = message.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [];
  return Array.from(new Set(matches.filter((m) => !RESOLVABLE_VARS.has(m))));
}

const PAYMENT_BADGE: Record<EnrichedStudent["paymentStatus"], string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  due: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

const ACTIVE_BADGE: Record<EnrichedStudent["activeStatus"], string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

const ENROLLMENT_BADGE: Record<EnrichedStudent["enrollmentStatus"], string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  suspended: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  none: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500",
};

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function matches(s: EnrichedStudent, f: Filters) {
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = `${s.firstName} ${s.lastName} ${s.phone ?? ""} ${s.email ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.courseName && s.courseName !== f.courseName) return false;
  if (f.batchName && s.batchName !== f.batchName) return false;
  if (f.courseType && s.courseType !== f.courseType) return false;
  if (f.paymentStatus && s.paymentStatus !== f.paymentStatus) return false;
  if (f.activeStatus && s.activeStatus !== f.activeStatus) return false;
  if (f.enrollmentStatus && s.enrollmentStatus !== f.enrollmentStatus) return false;
  const registeredAt = s.createdAt ?? "";
  if (f.registeredFrom && registeredAt < f.registeredFrom) return false;
  if (f.registeredTo && registeredAt > f.registeredTo) return false;
  if (f.lastLoginFrom && (!s.lastLoginAt || s.lastLoginAt < f.lastLoginFrom)) return false;
  if (f.lastLoginTo && (!s.lastLoginAt || s.lastLoginAt > f.lastLoginTo)) return false;
  return true;
}

type ChannelProgress = { total: number; sent: number; failed: number; status: "pending" | "running" | "completed" };

const PROGRESS_POLL_MS = 1200;

function ChannelProgressBar({ label, progress }: { label: string; progress: ChannelProgress }) {
  const done = progress.sent + progress.failed;
  const pct = progress.total > 0 ? Math.min(100, Math.round((done / progress.total) * 100)) : 100;
  const isDone = progress.status === "completed";
  return (
    <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600 dark:text-slate-300">
          {isDone ? `${label} done` : `Sending ${label}…`}
        </span>
        <span className="text-gray-500 dark:text-slate-400">
          {done} / {progress.total} {isDone ? "" : `· ${progress.total - done} remaining`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isDone && (
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {progress.sent} delivered{progress.failed > 0 ? `, ${progress.failed} failed` : ""}
        </p>
      )}
    </div>
  );
}

function SendMessageModal({
  students,
  templates,
  emailTemplates,
  onClose,
}: {
  students: EnrichedStudent[];
  templates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  onClose: () => void;
}) {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [selectedEventType, setSelectedEventType] = useState(templates[0]?.eventType ?? "");
  const [message, setMessage] = useState(templates[0]?.body ?? "");
  const [selectedEmailEventType, setSelectedEmailEventType] = useState(emailTemplates[0]?.eventType ?? "");
  const [emailSubject, setEmailSubject] = useState(emailTemplates[0]?.subject ?? "");
  const [emailBody, setEmailBody] = useState(emailTemplates[0]?.htmlBody ?? "");

  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [smsJobId, setSmsJobId] = useState<number | null>(null);
  const [emailJobId, setEmailJobId] = useState<number | null>(null);
  const [smsProgress, setSmsProgress] = useState<ChannelProgress | null>(null);
  const [emailProgress, setEmailProgress] = useState<ChannelProgress | null>(null);

  const selectedTemplate = templates.find((t) => t.eventType === selectedEventType) ?? null;
  const smsVariables = selectedTemplate ? parseTemplateVars(selectedTemplate.variables).map((v) => v.key) : [];
  const unresolvedSmsVars = useMemo(() => findUnresolvedVars(message), [message]);

  const selectedEmailTemplate = emailTemplates.find((t) => t.eventType === selectedEmailEventType) ?? null;
  const emailVariables = selectedEmailTemplate
    ? parseTemplateVars(selectedEmailTemplate.variables).map((v) => v.key)
    : ["{{student_name}}", "{{course_name}}", "{{batch_name}}", "{{site_name}}"];
  const unresolvedEmailVars = useMemo(
    () => findUnresolvedVars(`${emailSubject} ${emailBody}`),
    [emailSubject, emailBody],
  );

  function selectTemplate(eventType: string) {
    setSelectedEventType(eventType);
    const t = templates.find((x) => x.eventType === eventType);
    setMessage(t?.body ?? "");
  }

  function selectEmailTemplate(eventType: string) {
    setSelectedEmailEventType(eventType);
    const t = emailTemplates.find((x) => x.eventType === eventType);
    setEmailSubject(t?.subject ?? "");
    setEmailBody(t?.htmlBody ?? "");
  }

  function requestSend() {
    if (!smsEnabled && !emailEnabled) {
      toast.error("Select at least one channel — SMS or Email");
      return;
    }
    if (smsEnabled && !message.trim()) {
      toast.error("SMS message is required");
      return;
    }
    if (emailEnabled && !emailSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }
    if (emailEnabled && !emailBody.trim()) {
      toast.error("Email message is required");
      return;
    }
    setShowConfirm(true);
  }

  async function executeSend() {
    setShowConfirm(false);
    setIsSending(true);
    const studentIds = students.map((s) => s.id);

    const [smsRes, emailRes] = await Promise.all([
      smsEnabled ? sendSmsToStudentsAction(studentIds, message.trim()) : Promise.resolve(null),
      emailEnabled
        ? sendEmailToStudentsAction(studentIds, emailSubject.trim(), emailBody.trim())
        : Promise.resolve(null),
    ]);
    setIsSending(false);
    setSent(true);

    if (smsRes) {
      if (smsRes.success) {
        setSmsJobId(smsRes.data.jobId);
        setSmsProgress({ total: smsRes.data.total, sent: 0, failed: 0, status: "pending" });
      } else {
        toast.error(smsRes.message ?? "Failed to send SMS");
      }
    }
    if (emailRes) {
      if (emailRes.success) {
        setEmailJobId(emailRes.data.jobId);
        setEmailProgress({ total: emailRes.data.total, sent: 0, failed: 0, status: "pending" });
      } else {
        toast.error(emailRes.message ?? "Failed to send email");
      }
    }
  }

  // Poll each active job's progress until it's completed, then stop —
  // gives a live "X / N sent, Y remaining" view instead of one final result.
  useEffect(() => {
    const smsActive = smsJobId != null && smsProgress?.status !== "completed";
    const emailActive = emailJobId != null && emailProgress?.status !== "completed";
    if (!smsActive && !emailActive) return;

    const interval = setInterval(async () => {
      if (smsActive && smsJobId != null) {
        const res = await getBroadcastJobAction(smsJobId);
        if (res.success) {
          setSmsProgress((prev) => {
            if (res.data.status === "completed" && prev?.status !== "completed") {
              toast.success(`SMS sent — ${res.data.sent} delivered, ${res.data.failed} failed`);
            }
            return { total: res.data.total, sent: res.data.sent, failed: res.data.failed, status: res.data.status };
          });
        }
      }
      if (emailActive && emailJobId != null) {
        const res = await getBroadcastJobAction(emailJobId);
        if (res.success) {
          setEmailProgress((prev) => {
            if (res.data.status === "completed" && prev?.status !== "completed") {
              toast.success(`Email sent — ${res.data.sent} delivered, ${res.data.failed} failed`);
            }
            return { total: res.data.total, sent: res.data.sent, failed: res.data.failed, status: res.data.status };
          });
        }
      }
    }, PROGRESS_POLL_MS);

    return () => clearInterval(interval);
  }, [smsJobId, emailJobId, smsProgress?.status, emailProgress?.status]);

  const channelLabel = smsEnabled && emailEnabled ? "SMS and Email" : emailEnabled ? "Email" : "SMS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dark:bg-black/60">
      <ConfirmModal
        open={showConfirm}
        title={`Send real ${channelLabel}`}
        message={
          <>
            This sends {channelLabel === "SMS and Email" ? "an actual SMS and email" : `an actual ${channelLabel}`}{" "}
            to <strong>{students.length} student(s)</strong> and cannot be undone. Continue?
          </>
        }
        confirmLabel="Yes, send now"
        variant="warning"
        isPending={isSending}
        onConfirm={executeSend}
        onClose={() => setShowConfirm(false)}
      />
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Send Message</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">{students.length} student(s) selected</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="max-h-24 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex flex-wrap gap-1.5">
              {students.slice(0, 12).map((s) => (
                <span
                  key={s.id}
                  className="rounded-lg border border-gray-100 bg-white px-2 py-0.5 text-[11px] text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {s.firstName} {s.lastName}
                </span>
              ))}
              {students.length > 12 && (
                <span className="rounded-lg border border-gray-100 bg-white px-2 py-0.5 text-[11px] text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  +{students.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Channel selector */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="cursor-pointer rounded border-gray-300 dark:border-slate-600"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
              />
              SMS
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="cursor-pointer rounded border-gray-300 dark:border-slate-600"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              Email
            </label>
          </div>

          {/* SMS section */}
          {smsEnabled && (
            <div className="space-y-2.5 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">SMS</p>

              {templates.length > 0 ? (
                <select
                  className={`w-full ${inputCls}`}
                  value={selectedEventType}
                  onChange={(e) => selectTemplate(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.eventType} value={t.eventType}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                  No active templates found.
                </p>
              )}

              {smsVariables.length > 0 && (
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 dark:border-brand-900/40 dark:bg-brand-500/10">
                  <p className="mb-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">Insert variable</p>
                  <div className="flex flex-wrap gap-1.5">
                    {smsVariables.map((v) => (
                      <button
                        key={v}
                        onClick={() => setMessage((m) => `${m}${m.endsWith(" ") || m === "" ? "" : " "}${v}`)}
                        className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-brand-900/30"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Type your SMS message…"
                className={`w-full resize-none ${inputCls}`}
              />
              <p className="text-right text-xs text-gray-400 dark:text-slate-500">{message.length} chars</p>

              {unresolvedSmsVars.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                  <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" />
                  <span>
                    {unresolvedSmsVars.join(", ")} {unresolvedSmsVars.length === 1 ? "isn't" : "aren't"} backed by
                    real data yet — it will be sent as literal text, not filled in per student.
                  </span>
                </div>
              )}

              {smsProgress && <ChannelProgressBar label="SMS" progress={smsProgress} />}
            </div>
          )}

          {/* Email section */}
          {emailEnabled && (
            <div className="space-y-2.5 rounded-xl border border-gray-100 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Email</p>

              {emailTemplates.length > 0 ? (
                <select
                  className={`w-full ${inputCls}`}
                  value={selectedEmailEventType}
                  onChange={(e) => selectEmailTemplate(e.target.value)}
                >
                  {emailTemplates.map((t) => (
                    <option key={t.eventType} value={t.eventType}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                  No active templates found.
                </p>
              )}

              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject…"
                className={`w-full ${inputCls}`}
              />

              <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 dark:border-brand-900/40 dark:bg-brand-500/10">
                <p className="mb-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {emailVariables.map((v) => (
                    <button
                      key={v}
                      onClick={() => setEmailBody((m) => `${m}${m.endsWith(" ") || m === "" ? "" : " "}${v}`)}
                      className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300 dark:hover:bg-brand-900/30"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
                placeholder="Type your email message…"
                className={`w-full resize-none ${inputCls}`}
              />
              <p className="text-right text-xs text-gray-400 dark:text-slate-500">{emailBody.length} chars</p>

              {unresolvedEmailVars.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                  <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" />
                  <span>
                    {unresolvedEmailVars.join(", ")} {unresolvedEmailVars.length === 1 ? "isn't" : "aren't"} backed
                    by real data yet — it will be sent as literal text, not filled in per student.
                  </span>
                </div>
              )}

              {emailProgress && <ChannelProgressBar label="Email" progress={emailProgress} />}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3.5 dark:border-slate-800">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
          >
            {sent ? "Close" : "Cancel"}
          </button>
          {!sent && (
            <button
              onClick={requestSend}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isSending ? <SpinnerGap size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
              {isSending ? "Sending…" : `Send to ${students.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentFiltersClient({
  initial,
  loadError,
  smsTemplates,
  emailTemplates,
  enrollmentByUserId,
}: {
  initial: Student[];
  loadError: string | null;
  smsTemplates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  enrollmentByUserId: Record<number, EnrollmentSummaryRow>;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  // -1 means "show all" (no pagination).
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState("10");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("students");

  const enriched = useMemo(
    () => initial.map((s) => enrichStudent(s, enrollmentByUserId[s.id])),
    [initial, enrollmentByUserId],
  );
  const filtered = useMemo(() => enriched.filter((s) => matches(s, filters)), [enriched, filters]);
  const allCourseNames = useMemo(
    () => Array.from(new Set(enriched.map((s) => s.courseName).filter((c) => c !== "No enrollment"))),
    [enriched],
  );
  const allBatchNames = useMemo(
    () => Array.from(new Set(enriched.map((s) => s.batchName).filter((b): b is string => !!b))),
    [enriched],
  );
  const totalItems = filtered.length;
  const showAll = pageSize === -1;
  const effectivePageSize = showAll ? Math.max(totalItems, 1) : pageSize;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = showAll
    ? filtered
    : filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
  const displayFrom = totalItems === 0 ? 0 : showAll ? 1 : (currentPage - 1) * effectivePageSize + 1;
  const displayTo = showAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  const pageButtons = useMemo((): (number | "…")[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "…", totalPages];
    if (currentPage >= totalPages - 2) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage, "…", totalPages];
  }, [totalPages, currentPage]);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((s) => selected.has(s.id));

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPageSizeInput(size === -1 ? "" : String(size));
    setPage(1);
  }

  function applyCustomPageSize() {
    const n = Math.floor(Number(pageSizeInput));
    if (!Number.isFinite(n) || n < 1) {
      setPageSizeInput(String(pageSize === -1 ? totalItems || 1 : pageSize));
      return;
    }
    setPageSize(n);
    setPage(1);
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((s) => next.delete(s.id));
      else pageRows.forEach((s) => next.add(s.id));
      return next;
    });
  }

  function selectAllMatching() {
    setSelected(new Set(filtered.map((s) => s.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const selectedStudents = enriched.filter((s) => selected.has(s.id));
  const allFilteredSelected = totalItems > 0 && selected.size === totalItems && filtered.every((s) => selected.has(s.id));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
          <Users size={18} weight="fill" className="text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Filters</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage students, SMS history, and email history
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "students"
              ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Users size={16} weight="fill" />
          Students
        </button>
        <button
          onClick={() => setActiveTab("sms")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "sms"
              ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <DeviceMobile size={16} weight="fill" />
          SMS History
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "email"
              ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Envelope size={16} weight="fill" />
          Email History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "students" && (
        <>
          {loadError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-400">
              <WarningCircle size={16} weight="fill" /> Couldn&apos;t load students: {loadError}
            </div>
          )}

          {/* Filter bar */}
      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          <Funnel size={14} weight="fill" /> Filters
        </div>
        <div className="mb-3">
          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search by name, phone, or email…"
              className={`w-full pl-9 ${inputCls}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Course</label>
            <select className={`w-full ${inputCls}`} value={filters.courseName} onChange={(e) => updateFilter("courseName", e.target.value)}>
              <option value="">All courses</option>
              {allCourseNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Batch</label>
            <select className={`w-full ${inputCls}`} value={filters.batchName} onChange={(e) => updateFilter("batchName", e.target.value)}>
              <option value="">All batches</option>
              {allBatchNames.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Course type</label>
            <select className={`w-full ${inputCls}`} value={filters.courseType} onChange={(e) => updateFilter("courseType", e.target.value as Filters["courseType"])}>
              <option value="">Live / Recorded</option>
              <option value="live">Live only</option>
              <option value="recorded">Recorded only</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Payment</label>
            <select className={`w-full ${inputCls}`} value={filters.paymentStatus} onChange={(e) => updateFilter("paymentStatus", e.target.value as Filters["paymentStatus"])}>
              <option value="">All payment status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Account status</label>
            <select className={`w-full ${inputCls}`} value={filters.activeStatus} onChange={(e) => updateFilter("activeStatus", e.target.value as Filters["activeStatus"])}>
              <option value="">Active / Inactive</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Enrollment</label>
            <select className={`w-full ${inputCls}`} value={filters.enrollmentStatus} onChange={(e) => updateFilter("enrollmentStatus", e.target.value as Filters["enrollmentStatus"])}>
              <option value="">All enrollment status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
              <option value="refunded">Refunded</option>
              <option value="none">No enrollment</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-gray-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Registration date</label>
            <div className="flex items-center gap-2">
              <input type="date" className={inputCls} value={filters.registeredFrom} onChange={(e) => updateFilter("registeredFrom", e.target.value)} />
              <span className="text-xs text-gray-400 dark:text-slate-500">to</span>
              <input type="date" className={inputCls} value={filters.registeredTo} onChange={(e) => updateFilter("registeredTo", e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Last login</label>
            <div className="flex items-center gap-2">
              <input type="date" className={inputCls} value={filters.lastLoginFrom} onChange={(e) => updateFilter("lastLoginFrom", e.target.value)} />
              <span className="text-xs text-gray-400 dark:text-slate-500">to</span>
              <input type="date" className={inputCls} value={filters.lastLoginTo} onChange={(e) => updateFilter("lastLoginTo", e.target.value)} />
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowClockwise size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <span>
            Showing {pageRows.length} student(s) on this page
            {totalItems > pageRows.length ? ` (out of ${totalItems} total)` : ""}
            {selected.size > 0 ? ` · ${selected.size} selected` : ""}
          </span>
          {pageRows.length > 0 && !allOnPageSelected && (
            <button
              onClick={toggleAllOnPage}
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Select page ({pageRows.length})
            </button>
          )}
          {selected.size > 0 && (
            <button onClick={clearSelection} className="font-medium text-gray-500 hover:underline dark:text-slate-400">
              Clear selection
            </button>
          )}
        </div>
        <button
          onClick={() => selected.size > 0 && setShowSendModal(true)}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          <PaperPlaneTilt size={14} weight="fill" /> Send Message {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    className="cursor-pointer rounded border-gray-300 dark:border-slate-600"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                  />
                </th>
                <th className="px-3 py-2.5 whitespace-nowrap">Student</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Course / Batch</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Payment</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Enrollment</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Registered</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Last login</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-50 last:border-0 dark:border-slate-800/60 ${
                    selected.has(s.id) ? "bg-brand-50/40 dark:bg-brand-500/5" : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-gray-300 dark:border-slate-600"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.phone ?? s.email ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <p className="text-gray-700 dark:text-slate-300">{s.courseName}</p>
                    {s.courseType !== "none" && (
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {s.batchName ?? "Recorded"} · {s.courseType === "live" ? "Live" : "Recorded"}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${PAYMENT_BADGE[s.paymentStatus]}`}>
                      {s.paymentStatus}
                    </span>
                    {s.dueAmount > 0 && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">BDT {s.dueAmount.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${ACTIVE_BADGE[s.activeStatus]}`}>
                      {s.activeStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${ENROLLMENT_BADGE[s.enrollmentStatus]}`}>
                      {s.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDate(s.createdAt)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDate(s.lastLoginAt)}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                    No students match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <span className="text-xs">
                Showing {displayFrom}–{displayTo} of {totalItems} results
              </span>
            )}
            <select
              value={showAll ? "all" : [10, 20, 50, 100].includes(pageSize) ? pageSize : "custom"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") changePageSize(-1);
                else if (v === "custom") { /* keep current; input below takes over */ }
                else changePageSize(Number(v));
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
              <option value="custom">Custom…</option>
              <option value="all">All ({totalItems})</option>
            </select>
            <input
              type="number"
              min={1}
              value={pageSizeInput}
              onChange={(e) => setPageSizeInput(e.target.value)}
              onBlur={applyCustomPageSize}
              onKeyDown={(e) => e.key === "Enter" && applyCustomPageSize()}
              placeholder="Custom"
              className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <CaretDoubleLeft size={13} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <CaretLeft size={13} />
            </button>

            {pageButtons.map((pg, idx) =>
              pg === "…" ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-slate-500">…</span>
              ) : (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                    currentPage === pg
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {pg}
                </button>
              ),
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <CaretRight size={13} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <CaretDoubleRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendMessageModal
          students={selectedStudents}
          templates={smsTemplates}
          emailTemplates={emailTemplates}
          onClose={() => setShowSendModal(false)}
        />
      )}
        </>
      )}

      {activeTab === "sms" && <SmsHistoryTab />}
      {activeTab === "email" && <EmailHistoryTab />}
    </div>
  );
}
