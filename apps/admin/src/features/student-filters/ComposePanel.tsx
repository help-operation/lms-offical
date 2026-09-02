"use client";

import { useMemo, useState } from "react";
import { WarningCircle, Clock, ArrowsClockwise } from "@phosphor-icons/react";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { countSegments, type SmsInfo } from "./sms-counter";

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
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

type ComposePanelProps = {
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

  return (
    <div className="space-y-4">
      {/* 1. Template */}
      <Section title="Template">
        {channel === "sms" ? (
          smsTemplates.length > 0 ? (
            <select
              className={`w-full ${inputCls}`}
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
          ) : (
            <EmptyMsg>No SMS templates found.</EmptyMsg>
          )
        ) : emailTemplates.length > 0 ? (
          <select
            className={`w-full ${inputCls}`}
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
        ) : (
          <EmptyMsg>No email templates found.</EmptyMsg>
        )}
      </Section>

      {/* 2. Send Type */}
      <Section title="Send Type">
        <div className="flex gap-2">
          {(["sms", "email"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => onChannelChange(ch)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                channel === ch
                  ? "border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-100 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {ch === "sms" ? "📱 SMS" : "✉️ Email"}
            </button>
          ))}
        </div>
      </Section>

      {/* 3. Schedule */}
      <Section title="Schedule">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-slate-300">Send later</span>
          <button
            onClick={() => onScheduleToggle(!isScheduled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isScheduled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isScheduled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {isScheduled && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-slate-400">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => onScheduledDateChange(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-slate-400">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>
          </div>
        )}
      </Section>

      {/* 4. Interval */}
      <Section title="Interval">
        <div className="flex items-center gap-2">
          <ArrowsClockwise size={14} className="text-gray-400 dark:text-slate-500" />
          <input
            type="number"
            min={0}
            max={3600}
            value={interval}
            onChange={(e) => onIntervalChange(Math.max(0, Number(e.target.value)))}
            className={`w-24 ${inputCls}`}
          />
          <span className="text-xs text-gray-500 dark:text-slate-400">seconds between messages</span>
        </div>
      </Section>

      {/* 5. Variables */}
      {channel === "sms" && smsVars.length > 0 && (
        <Section title="Variables">
          <div className="flex flex-wrap gap-1.5">
            {smsVars.map((v) => (
              <button
                key={v}
                onClick={() => onSmsMessageChange(`${smsMessage}${smsMessage.endsWith(" ") || smsMessage === "" ? "" : " "}${v}`)}
                className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
              >
                {v}
              </button>
            ))}
          </div>
        </Section>
      )}
      {channel === "email" && emailVars.length > 0 && (
        <Section title="Variables">
          <div className="flex flex-wrap gap-1.5">
            {emailVars.map((v) => (
              <button
                key={v}
                onClick={() => onEmailBodyChange(`${emailBody}${emailBody.endsWith(" ") || emailBody === "" ? "" : " "}${v}`)}
                className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
              >
                {v}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* 6. Message */}
      <Section title="Message">
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
          value={channel === "sms" ? smsMessage : emailBody}
          onChange={(e) => channel === "sms" ? onSmsMessageChange(e.target.value) : onEmailBodyChange(e.target.value)}
          rows={channel === "sms" ? 6 : 8}
          placeholder={channel === "sms" ? "Type your SMS message…" : "Type your email message…"}
          className={`w-full resize-none ${inputCls}`}
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
      </Section>

      {/* 7. Live Counter (SMS only) */}
      {channel === "sms" && smsMessage.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
          <SmsCounterBar info={smsInfo} recipientCount={recipientCount} />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
        {title}
      </label>
      {children}
    </div>
  );
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
      {children}
    </p>
  );
}

function SmsCounterBar({ info, recipientCount }: { info: SmsInfo; recipientCount: number }) {
  const totalChars = info.charCount * Math.max(1, recipientCount);
  const totalSms = info.segments * Math.max(1, recipientCount);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-semibold text-gray-900 dark:text-white">
        {info.charCount.toLocaleString()} Characters
      </span>
      <span className="text-gray-300 dark:text-slate-600">|</span>
      <span className={`font-semibold ${info.segments > 1 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
        {info.segments} SMS
      </span>
      <span className="text-gray-300 dark:text-slate-600">|</span>
      <span className="font-semibold text-brand-600 dark:text-brand-400">
        {recipientCount.toLocaleString()} Students Selected
      </span>
    </div>
  );
}
