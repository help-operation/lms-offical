"use client";

import { useEffect, useMemo, useState } from "react";
import { PaperPlaneTilt, SpinnerGap, X, WarningCircle } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { EnrichedStudent } from "./types";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { sendSmsToStudentsAction, sendEmailToStudentsAction } from "./actions";
import { getBroadcastJobAction } from "@/features/broadcast-jobs/actions";

const RESOLVABLE_VARS = new Set(["{{student_name}}", "{{name}}", "{{course_name}}", "{{course_title}}", "{{batch_name}}", "{{site_name}}"]);

function parseTemplateVars(json: string): { key: string; description: string }[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function findUnresolvedVars(message: string): string[] {
  const matches = message.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [];
  return Array.from(new Set(matches.filter((m) => !RESOLVABLE_VARS.has(m))));
}

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

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

export function SendMessageModal({
  students,
  templates,
  emailTemplates,
  initialChannel = "both",
  onClose,
}: {
  students: EnrichedStudent[];
  templates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  initialChannel?: "sms" | "email" | "both";
  onClose: () => void;
}) {
  const [smsEnabled, setSmsEnabled] = useState(initialChannel === "sms" || initialChannel === "both");
  const [emailEnabled, setEmailEnabled] = useState(initialChannel === "email" || initialChannel === "both");

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
