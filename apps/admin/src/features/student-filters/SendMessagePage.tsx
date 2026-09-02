"use client";

import { useEffect, useState } from "react";
import { toast } from "@repo/ui/sonner";
import type { EnrichedStudent } from "./types";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { sendSmsToStudentsAction, sendEmailToStudentsAction } from "./actions";
import { getBroadcastJobAction } from "@/features/broadcast-jobs/actions";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { RecipientsPanel, type Recipient } from "./RecipientsPanel";
import { ComposePanel } from "./ComposePanel";
import type { CsvRecipient } from "./csv-parser";

type Progress = { total: number; sent: number; failed: number; status: "pending" | "running" | "completed" };

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

  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState(smsTemplates[0]?.eventType ?? "");
  const [smsMessage, setSmsMessage] = useState(smsTemplates[0]?.body ?? "");
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(emailTemplates[0]?.eventType ?? "");
  const [emailSubject, setEmailSubject] = useState(emailTemplates[0]?.subject ?? "");
  const [emailBody, setEmailBody] = useState(emailTemplates[0]?.htmlBody ?? "");

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [smsJobId, setSmsJobId] = useState<number | null>(null);
  const [emailJobId, setEmailJobId] = useState<number | null>(null);
  const [smsProgress, setSmsProgress] = useState<Progress | null>(null);
  const [emailProgress, setEmailProgress] = useState<Progress | null>(null);

  // Sync initial selected students
  useEffect(() => {
    setSelectedStudents(initialSelected);
  }, [initialSelected]);

  const recipientCount = selectedStudents.length + csvRecipients.length;

  function removeStudent(id: number) {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
    onRemoveFromParent(id);
  }

  function clearStudents() {
    selectedStudents.forEach((s) => onRemoveFromParent(s.id));
    setSelectedStudents([]);
  }

  function addCsvRecipients(recipients: CsvRecipient[]) {
    setCsvRecipients((prev) => [...prev, ...recipients]);
  }

  function removeCsvRecipient(index: number) {
    setCsvRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCsv() {
    setCsvRecipients([]);
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
    const csvPhoneNumbers = csvRecipients.filter((r) => r.phone).map((r) => r.phone);
    const csvEmails = csvRecipients.filter((r) => r.email).map((r) => r.email);

    const [smsRes, emailRes] = await Promise.all([
      channel === "sms" && (studentIds.length > 0 || csvPhoneNumbers.length > 0)
        ? sendSmsToStudentsAction(studentIds, smsMessage.trim())
        : Promise.resolve(null),
      channel === "email" && (studentIds.length > 0 || csvEmails.length > 0)
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

    if (csvPhoneNumbers.length > 0 && channel === "sms" && !smsRes?.success) {
      toast.info(`CSV phone numbers (${csvPhoneNumbers.length}) ready for direct SMS (coming soon)`);
    }
    if (csvEmails.length > 0 && channel === "email" && !emailRes?.success) {
      toast.info(`CSV emails (${csvEmails.length}) ready for direct Email (coming soon)`);
    }
  }

  // Poll progress
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
    }, 1200);

    return () => clearInterval(interval);
  }, [smsJobId, emailJobId, smsProgress?.status, emailProgress?.status]);

  const channelLabel = channel === "sms" ? "SMS" : "Email";

  return (
    <div className="space-y-4">
      {/* Confirm dialog */}
      <ConfirmModal
        open={showConfirm}
        title={`Send ${channelLabel}`}
        message={
          <>
            Send {channelLabel} to <strong>{recipientCount} recipient(s)</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Yes, send now"
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

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Left: Recipients */}
        <RecipientsPanel
          selectedStudents={selectedStudents}
          csvRecipients={csvRecipients}
          onRemoveStudent={removeStudent}
          onClearStudents={clearStudents}
          onAddCsvRecipients={addCsvRecipients}
          onRemoveCsvRecipient={removeCsvRecipient}
          onClearCsv={clearCsv}
        />

        {/* Right: Compose */}
        <ComposePanel
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
          onSend={requestSend}
          isSending={isSending}
        />
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
