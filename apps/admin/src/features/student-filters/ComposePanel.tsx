"use client";

import { useMemo } from "react";
import { WarningCircle, Clock, ArrowsClockwise, CaretDown } from "@phosphor-icons/react";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { countSegments, type SmsInfo } from "./sms-counter";

const inputCls =
  "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

const RESOLVABLE_VARS = new Set(["{{student_name}}", "{{name}}", "{{course_name}}", "{{course_title}}", "{{batch_name}}", "{{site_name}}"]);

function parseTemplateVars(json: string): { key: string; description: string }[] {
  try { return JSON.parse(json); } catch { return []; }
}

function findUnresolvedVars(text: string): string[] {
  const matches = text.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [];
  return Array.from(new Set(matches.filter((m) => !RESOLVABLE_VARS.has(m))));
}

type MessageType = "template" | "custom";

type ComposePanelProps = {
  messageType: MessageType;
  onMessageTypeChange: (t: MessageType) => void;
  channel: "sms" | "email";
  onChannelChange: (ch: "sms" | "email") => void;
  smsTemplates: SmsTemplate[];
  emailTemplates: EmailTemplate[];
  selectedSmsTemplate: string;
  onSmsTemplateChange: (eventType: string) => void;
  smsMessage: string;
  onSmsMessageChange: (msg: string) => void;
  selectedEmailTemplate: string;
  onEmailTemplateChange: (eventType: string) => void;
  emailSubject: string;
  onEmailSubjectChange: (subject: string) => void;
  emailBody: string;
  onEmailBodyChange: (body: string) => void;
  recipientCount: number;
  isScheduled: boolean;
  onScheduleToggle: (on: boolean) => void;
  scheduledDate: string;
  onScheduledDateChange: (d: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (t: string) => void;
  interval: number;
  onIntervalChange: (sec: number) => void;
};

export function ComposePanel({
  messageType,
  onMessageTypeChange,
  channel,
  onChannelChange,
  smsTemplates,
  emailTemplates,
  selectedSmsTemplate,
  onSmsTemplateChange,
  smsMessage,
  onSmsMessageChange,
  selectedEmailTemplate,
  onEmailTemplateChange,
  emailSubject,
  onEmailSubjectChange,
  emailBody,
  onEmailBodyChange,
  recipientCount,
  isScheduled,
  onScheduleToggle,
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
  interval,
  onIntervalChange,
}: ComposePanelProps) {
  const smsInfo = useMemo(() => countSegments(smsMessage), [smsMessage]);
  const unresolvedSms = useMemo(() => findUnresolvedVars(smsMessage), [smsMessage]);
  const unresolvedEmail = useMemo(() => findUnresolvedVars(`${emailSubject} ${emailBody}`), [emailSubject, emailBody]);

  const selectedSms = smsTemplates.find((t) => t.eventType === selectedSmsTemplate) ?? null;
  const smsVars = selectedSms ? parseTemplateVars(selectedSms.variables).map((v) => v.key) : [];

  const selectedEmailT = emailTemplates.find((t) => t.eventType === selectedEmailTemplate) ?? null;
  const emailVars = selectedEmailT
    ? parseTemplateVars(selectedEmailT.variables).map((v) => v.key)
    : ["{{student_name}}", "{{course_name}}", "{{batch_name}}", "{{site_name}}"];

  const activeVars = channel === "sms" ? smsVars : emailVars;
  const activeMessage = channel === "sms" ? smsMessage : emailBody;

  return (
    <div className="space-y-5">
      {/* Row 1: Message Type + Channel — side by side */}
      <div className="flex items-end gap-4">
        {/* Message Type */}
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Message Type
          </label>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            {([
              ["template", "Template"],
              ["custom", "Custom Message"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => onMessageTypeChange(val)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  messageType === val
                    ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Send Via
          </label>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            {([
              ["sms", "📱 SMS"],
              ["email", "✉️ Email"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => onChannelChange(val)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  channel === val
                    ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template selector (only when messageType === "template") */}
      {messageType === "template" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Select Template
          </label>
          {channel === "sms" ? (
            smsTemplates.length > 0 ? (
              <div className="relative">
                <select
                  className={`w-full appearance-none pr-8 ${inputCls}`}
                  value={selectedSmsTemplate}
                  onChange={(e) => {
                    onSmsTemplateChange(e.target.value);
                    const t = smsTemplates.find((x) => x.eventType === e.target.value);
                    if (t) onSmsMessageChange(t.body);
                  }}
                >
                  {smsTemplates.map((t) => (
                    <option key={t.eventType} value={t.eventType}>{t.name}</option>
                  ))}
                </select>
                <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            ) : (
              <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                No SMS templates available.
              </p>
            )
          ) : emailTemplates.length > 0 ? (
            <div className="relative">
              <select
                className={`w-full appearance-none pr-8 ${inputCls}`}
                value={selectedEmailTemplate}
                onChange={(e) => {
                  onEmailTemplateChange(e.target.value);
                  const t = emailTemplates.find((x) => x.eventType === e.target.value);
                  if (t) {
                    onEmailSubjectChange(t.subject);
                    onEmailBodyChange(t.htmlBody);
                  }
                }}
              >
                {emailTemplates.map((t) => (
                  <option key={t.eventType} value={t.eventType}>{t.name}</option>
                ))}
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
              No email templates available.
            </p>
          )}
        </div>
      )}

      {/* Variables */}
      {activeVars.length > 0 && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Insert Variable
          </label>
          <div className="flex flex-wrap gap-1.5">
            {activeVars.map((v) => (
              <button
                key={v}
                onClick={() => {
                  if (channel === "sms") {
                    onSmsMessageChange(`${smsMessage}${smsMessage.endsWith(" ") || smsMessage === "" ? "" : " "}${v}`);
                  } else {
                    onEmailBodyChange(`${emailBody}${emailBody.endsWith(" ") || emailBody === "" ? "" : " "}${v}`);
                  }
                }}
                className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message editor */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          {messageType === "template" ? "Message Preview" : "Your Message"}
        </label>
        {channel === "email" && (
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => onEmailSubjectChange(e.target.value)}
            placeholder="Subject…"
            className={`mb-2 w-full ${inputCls}`}
          />
        )}
        <textarea
          value={activeMessage}
          onChange={(e) => channel === "sms" ? onSmsMessageChange(e.target.value) : onEmailBodyChange(e.target.value)}
          rows={channel === "sms" ? 6 : 8}
          placeholder={channel === "sms" ? "Type your SMS message…" : "Type your email message…"}
          className={`w-full resize-none ${inputCls}`}
          readOnly={messageType === "template"}
        />
        {/* Unresolved vars */}
        {(channel === "sms" && unresolvedSms.length > 0) && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
            <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
            <span>{unresolvedSms.join(", ")} won&apos;t be replaced.</span>
          </div>
        )}
        {(channel === "email" && unresolvedEmail.length > 0) && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
            <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
            <span>{unresolvedEmail.join(", ")} won&apos;t be replaced.</span>
          </div>
        )}
      </div>

      {/* Schedule + Interval — grouped */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Schedule</span>
          </div>
          <button
            onClick={() => onScheduleToggle(!isScheduled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              isScheduled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isScheduled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {isScheduled && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => onScheduledDateChange(e.target.value)}
                className={`w-full text-xs ${inputCls}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
                className={`w-full text-xs ${inputCls}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Interval</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={3600}
                  value={interval}
                  onChange={(e) => onIntervalChange(Math.max(0, Number(e.target.value)))}
                  className={`w-16 text-xs ${inputCls}`}
                />
                <span className="text-[10px] text-gray-400 dark:text-slate-500">sec</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live counter */}
      {channel === "sms" && smsMessage.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-gray-900 dark:text-white">
            {smsInfo.charCount.toLocaleString()} Characters
          </span>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <span className={`font-semibold ${smsInfo.segments > 1 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
            {smsInfo.segments} SMS
          </span>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            {recipientCount.toLocaleString()} Students Selected
          </span>
        </div>
      )}
    </div>
  );
}
