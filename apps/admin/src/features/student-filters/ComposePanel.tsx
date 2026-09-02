"use client";

import { useMemo } from "react";
import { WarningCircle, PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import type { SmsTemplate } from "@/features/sms-templates/types";
import type { EmailTemplate } from "@/features/email-templates/types";
import { countSegments, type SmsInfo } from "./sms-counter";
import { PhonePreview } from "./PhonePreview";

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
  onSend: () => void;
  isSending: boolean;
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
  onSend,
  isSending,
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

  const activeMessage = channel === "sms" ? smsMessage : emailBody;
  const activeSubject = channel === "email" ? emailSubject : undefined;

  const channelLabel = channel === "sms" ? "SMS" : "Email";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Compose {channelLabel}</h3>
        {recipientCount > 0 && (
          <button
            onClick={onSend}
            disabled={isSending || recipientCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {isSending ? <SpinnerGap size={13} className="animate-spin" /> : <PaperPlaneTilt size={13} weight="fill" />}
            {isSending ? "Sending…" : `Send to ${recipientCount}`}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Channel toggle */}
        <div className="mb-4 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <input
              type="radio"
              className="cursor-pointer accent-brand-600"
              checked={channel === "sms"}
              onChange={() => onChannelChange("sms")}
            />
            SMS
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <input
              type="radio"
              className="cursor-pointer accent-brand-600"
              checked={channel === "email"}
              onChange={() => onChannelChange("email")}
            />
            Email
          </label>
        </div>

        {/* SMS Compose */}
        {channel === "sms" && (
          <div className="space-y-3">
            {/* Template */}
            {smsTemplates.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Template</label>
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
              </div>
            )}

            {/* Variables */}
            {smsVars.length > 0 && (
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 dark:border-brand-900/40 dark:bg-brand-500/10">
                <p className="mb-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {smsVars.map((v) => (
                    <button
                      key={v}
                      onClick={() => onSmsMessageChange(`${smsMessage}${smsMessage.endsWith(" ") || smsMessage === "" ? "" : " "}${v}`)}
                      className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Message</label>
              <textarea
                value={smsMessage}
                onChange={(e) => onSmsMessageChange(e.target.value)}
                rows={5}
                placeholder="Type your SMS message…"
                className={`w-full resize-none ${inputCls}`}
              />
            </div>

            {/* Unresolved vars warning */}
            {unresolvedSms.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" />
                <span>
                  {unresolvedSms.join(", ")} won&apos;t be replaced — sent as literal text.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Email Compose */}
        {channel === "email" && (
          <div className="space-y-3">
            {/* Template */}
            {emailTemplates.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Template</label>
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
              </div>
            )}

            {/* Variables */}
            {emailVars.length > 0 && (
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-2.5 dark:border-brand-900/40 dark:bg-brand-500/10">
                <p className="mb-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {emailVars.map((v) => (
                    <button
                      key={v}
                      onClick={() => onEmailBodyChange(`${emailBody}${emailBody.endsWith(" ") || emailBody === "" ? "" : " "}${v}`)}
                      className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => onEmailSubjectChange(e.target.value)}
                placeholder="Email subject…"
                className={`w-full ${inputCls}`}
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => onEmailBodyChange(e.target.value)}
                rows={6}
                placeholder="Type your email message…"
                className={`w-full resize-none ${inputCls}`}
              />
            </div>

            {/* Unresolved vars warning */}
            {unresolvedEmail.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" />
                <span>
                  {unresolvedEmail.join(", ")} won&apos;t be replaced — sent as literal text.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Phone Preview */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Preview</p>
          <PhonePreview
            channel={channel}
            subject={activeSubject}
            message={activeMessage}
            recipientName="Student"
          />
        </div>
      </div>

      {/* SMS Counter Footer */}
      {channel === "sms" && smsMessage.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-800">
          <SmsCounterInfo info={smsInfo} />
        </div>
      )}
    </div>
  );
}

function SmsCounterInfo({ info }: { info: SmsInfo }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {info.charCount} chars
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
        <span className={`text-xs font-medium ${info.segments > 1 ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-slate-400"}`}>
          {info.segments} SMS{info.segments !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {info.encoding === "gsm7" ? "GSM-7" : "Unicode"}
        </span>
      </div>
      <div className="text-[10px] text-gray-400 dark:text-slate-500">
        {info.encoding === "gsm7" ? "160" : "70"} chars/seg
      </div>
    </div>
  );
}
