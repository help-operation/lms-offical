"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@repo/ui/sonner";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import type { EnrichedStudent } from "./types";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { sendSmsToStudentsAction, sendEmailToStudentsAction } from "./actions";
import { getBroadcastJobAction } from "@/features/broadcast-jobs/actions";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ComposePanel } from "./ComposePanel";
import { RecipientsPanel } from "./RecipientsPanel";
import { DevicePreview } from "./DevicePreview";
import type { CsvRecipient } from "./csv-parser";

type Progress = { total: number; sent: number; failed: number; status: "pending" | "running" | "completed" };
type MessageType = "template" | "custom";
type RightTab = "recipients" | "preview";

export function SendMessagePage({
  selectedStudents: initialSelected,
  smsTemplates,
  emailTemplates,
  onRemoveStudent: onRemoveFromParent,
}: {
  selectedStudents: EnrichedStudent[];
  smsTemplates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  onRemoveStudent: (id: number) => void;
}) {
  const [selectedStudents, setSelectedStudents] = useState<EnrichedStudent[]>(initialSelected);
  const [csvRecipients, setCsvRecipients] = useState<CsvRecipient[]>([]);
  const [allStudents, setAllStudents] = useState<EnrichedStudent[]>(initialSelected);

  // Compose state
  const [messageType, setMessageType] = useState<MessageType>("template");
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState(smsTemplates[0]?.eventType ?? "");
  const [smsMessage, setSmsMessage] = useState(smsTemplates[0]?.body ?? "");
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(emailTemplates[0]?.eventType ?? "");
  const [emailSubject, setEmailSubject] = useState(emailTemplates[0]?.subject ?? "");
  const [emailBody, setEmailBody] = useState(emailTemplates[0]?.htmlBody ?? "");

  // Schedule
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [interval, setInterval_] = useState(0);

  // UI state
  const [rightTab, setRightTab] = useState<RightTab>("recipients");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [smsJobId, setSmsJobId] = useState<number | null>(null);
  const [emailJobId, setEmailJobId] = useState<number | null>(null);
  const [smsProgress, setSmsProgress] = useState<Progress | null>(null);
  const [emailProgress, setEmailProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setSelectedStudents(initialSelected);
    setAllStudents((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newOnes = initialSelected.filter((s) => !existingIds.has(s.id));
      return [...prev, ...newOnes];
    });
  }, [initialSelected]);

  const selectedStudentIds = new Set(selectedStudents.map((s) => s.id));
  const recipientCount = selectedStudents.length + csvRecipients.length;

  function toggleStudent(id: number) {
    setSelectedStudents((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) {
        const student = prev.find((s) => s.id === id);
        if (student) onRemoveFromParent(student.id);
        return prev.filter((s) => s.id !== id);
      } else {
        const student = allStudents.find((s) => s.id === id);
        if (student) return [...prev, student];
        return prev;
      }
    });
  }

  function selectAll(ids: number[]) {
    const students = allStudents.filter((s) => ids.includes(s.id));
    setSelectedStudents((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newOnes = students.filter((s) => !existingIds.has(s.id));
      return [...prev, ...newOnes];
    });
  }

  function deselectAll() {
    selectedStudents.forEach((s) => onRemoveFromParent(s.id));
    setSelectedStudents([]);
  }

  function requestSend() {
    if (recipientCount === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    if (channel === "sms" && !smsMessage.trim()) {
      toast.error("SMS message is required");
      return;
    }
    if (channel === "email" && !emailSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }
    if (channel === "email" && !emailBody.trim()) {
      toast.error("Email body is required");
      return;
    }
    setShowConfirm(true);
  }

  async function executeSend() {
    setShowConfirm(false);
    setIsSending(true);

    const studentIds = selectedStudents.map((s) => s.id);

    const [smsRes, emailRes] = await Promise.all([
      channel === "sms" && studentIds.length > 0
        ? sendSmsToStudentsAction(studentIds, smsMessage.trim())
        : Promise.resolve(null),
      channel === "email" && studentIds.length > 0
        ? sendEmailToStudentsAction(studentIds, emailSubject.trim(), emailBody.trim())
        : Promise.resolve(null),
    ]);

    setIsSending(false);
    setSent(true);

    if (smsRes) {
      if (smsRes.success) {
        setSmsJobId(smsRes.data.jobId);
        setSmsProgress({ total: smsRes.data.total, sent: 0, failed: 0, status: "pending" });
        setRightTab("preview");
      } else {
        toast.error(smsRes.message ?? "Failed to send SMS");
      }
    }
    if (emailRes) {
      if (emailRes.success) {
        setEmailJobId(emailRes.data.jobId);
        setEmailProgress({ total: emailRes.data.total, sent: 0, failed: 0, status: "pending" });
        setRightTab("preview");
      } else {
        toast.error(emailRes.message ?? "Failed to send email");
      }
    }
  }

  useEffect(() => {
    const smsActive = smsJobId != null && smsProgress?.status !== "completed";
    const emailActive = emailJobId != null && emailProgress?.status !== "completed";
    if (!smsActive && !emailActive) return;

    const iv = setInterval(async () => {
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
    }, 1200);

    return () => clearInterval(iv);
  }, [smsJobId, emailJobId, smsProgress?.status, emailProgress?.status]);

  const activeMessage = channel === "sms" ? smsMessage : emailBody;
  const activeSubject = channel === "email" ? emailSubject : undefined;

  return (
    <div className="space-y-4">
      {/* Selection count bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {recipientCount.toLocaleString()} Students Selected
          </span>
          {selectedStudents.length > 0 && csvRecipients.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-slate-500">
              ({selectedStudents.length} from table, {csvRecipients.length} from CSV)
            </span>
          )}
        </div>
        {selectedStudentIds.size > 0 && (
          <button onClick={deselectAll} className="text-xs text-gray-400 hover:text-red-500 dark:text-slate-500">
            Clear all
          </button>
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmModal
        open={showConfirm}
        title={`Send ${channel === "sms" ? "SMS" : "Email"}`}
        message={
          <>
            Send {channel === "sms" ? "SMS" : "Email"} to <strong>{recipientCount} recipient(s)</strong>?
            {isScheduled && ` Scheduled for ${scheduledDate} ${scheduledTime}.`}
            {" "}This cannot be undone.
          </>
        }
        confirmLabel={isScheduled ? "Yes, schedule" : "Yes, send now"}
        variant="warning"
        isPending={isSending}
        onConfirm={executeSend}
        onClose={() => setShowConfirm(false)}
      />

      {/* Progress bars */}
      {(smsProgress || emailProgress) && (
        <div className="space-y-2">
          {smsProgress && <ProgressBar label="SMS" progress={smsProgress} />}
          {emailProgress && <ProgressBar label="Email" progress={emailProgress} />}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        {/* LEFT — Compose */}
        <div className="space-y-4">
          <ComposePanel
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            channel={channel}
            onChannelChange={setChannel}
            smsTemplates={smsTemplates}
            emailTemplates={emailTemplates}
            selectedSmsTemplate={selectedSmsTemplate}
            onSmsTemplateChange={setSelectedSmsTemplate}
            smsMessage={smsMessage}
            onSmsMessageChange={setSmsMessage}
            selectedEmailTemplate={selectedEmailTemplate}
            onEmailTemplateChange={setSelectedEmailTemplate}
            emailSubject={emailSubject}
            onEmailSubjectChange={setEmailSubject}
            emailBody={emailBody}
            onEmailBodyChange={setEmailBody}
            recipientCount={recipientCount}
            isScheduled={isScheduled}
            onScheduleToggle={setIsScheduled}
            scheduledDate={scheduledDate}
            onScheduledDateChange={setScheduledDate}
            scheduledTime={scheduledTime}
            onScheduledTimeChange={setScheduledTime}
            interval={interval}
            onIntervalChange={setInterval_}
          />

          {/* Send button */}
          <button
            onClick={requestSend}
            disabled={isSending || recipientCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl disabled:opacity-40 disabled:shadow-none"
          >
            {isSending ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} weight="fill" />}
            {isSending
              ? "Sending…"
              : isScheduled
                ? `Schedule for ${recipientCount} recipients`
                : `Send to ${recipientCount} recipients`
            }
          </button>
        </div>

        {/* RIGHT — Recipients / Preview */}
        <div className="flex flex-col">
          {/* Tab switcher */}
          <div className="mb-3 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setRightTab("recipients")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                rightTab === "recipients"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              👥 Recipients {recipientCount > 0 && `(${recipientCount})`}
            </button>
            <button
              onClick={() => setRightTab("preview")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                rightTab === "preview"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              📱 Preview
            </button>
          </div>

          <div className="flex-1">
            {rightTab === "recipients" ? (
              <RecipientsPanel
                allStudents={allStudents}
                selectedStudentIds={selectedStudentIds}
                csvRecipients={csvRecipients}
                onToggleStudent={toggleStudent}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onAddCsvRecipients={(r) => setCsvRecipients((prev) => [...prev, ...r])}
                onRemoveCsvRecipient={(i) => setCsvRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                onClearCsv={() => setCsvRecipients([])}
              />
            ) : (
              <DevicePreview
                channel={channel}
                subject={activeSubject}
                message={activeMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, progress }: { label: string; progress: Progress }) {
  const done = progress.sent + progress.failed;
  const pct = progress.total > 0 ? Math.min(100, Math.round((done / progress.total) * 100)) : 100;
  const isDone = progress.status === "completed";
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600 dark:text-slate-300">
          {isDone ? `${label} done` : `Sending ${label}…`}
        </span>
        <span className="text-gray-500 dark:text-slate-400">
          {done} / {progress.total}{isDone ? "" : ` · ${progress.total - done} remaining`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isDone && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {progress.sent} delivered{progress.failed > 0 ? `, ${progress.failed} failed` : ""}
        </p>
      )}
    </div>
  );
}
