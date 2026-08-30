"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChatText, PencilSimple, PaperPlaneTilt, SpinnerGap,
  X, Megaphone, ToggleLeft, ToggleRight, Info,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  getBroadcastCountsAction,
  sendBroadcastAction,
  sendTestSmsAction,
  setAutoSmsEnabledAction,
  toggleSmsTemplateAction,
  updateSmsTemplateAction,
} from "./actions";
import {
  SECTION_META, BROADCAST_SEGMENTS,
  type SmsTemplate, type TemplateVariable,
} from "./types";

/** GSM-ish segment estimate. */
function segments(len: number) {
  if (len === 0) return 0;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}

function parseVars(json: string): TemplateVariable[] {
  try { return JSON.parse(json); } catch { return []; }
}

// ─── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({
  template, onClose, onSaved,
}: {
  template: SmsTemplate;
  onClose: () => void;
  onSaved: (t: SmsTemplate) => void;
}) {
  const [body, setBody] = useState(template.body);
  const [testPhone, setTestPhone] = useState("");
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const vars = parseVars(template.variables);

  function save() {
    startSave(async () => {
      const res = await updateSmsTemplateAction(template.eventType, { body });
      if (res.success) { toast.success("Template saved"); onSaved(res.data); onClose(); }
      else toast.error(res.message ?? "Save failed");
    });
  }

  function sendTest() {
    if (!testPhone.trim()) { toast.error("Enter a phone number"); return; }
    startTest(async () => {
      const res = await sendTestSmsAction(template.eventType, testPhone.trim());
      if (res.success) toast.success(res.data.sent ? "Test SMS sent!" : "Dev mode — SMS logged to console");
      else toast.error(res.message ?? "Send failed");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{template.name}</h2>
            <p className="font-mono text-[11px] text-gray-400">{template.eventType}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="space-y-4 p-5">
          {vars.length > 0 && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
              <p className="mb-2 text-xs font-medium text-brand-700">Variables — click to insert</p>
              <div className="flex flex-wrap gap-1.5">
                {vars.map((v) => (
                  <button
                    key={v.key}
                    title={v.description}
                    onClick={() => setBody((b) => `${b}${v.key}`)}
                    className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
            <p className="text-right text-xs text-gray-400">
              {body.length} chars · {segments(body.length)} SMS
            </p>
          </div>

          {/* Send test */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <PaperPlaneTilt size={13} weight="fill" /> Send test SMS
            </p>
            <div className="flex gap-2">
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={sendTest}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {isTesting ? <SpinnerGap size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3.5">
          <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} disabled={isSaving} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {isSaving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Broadcast tab ───────────────────────────────────────────────────────────

function BroadcastTab({ counts }: { counts: Record<string, number> }) {
  const [liveCounts, setLiveCounts] = useState(counts);
  const [segment, setSegment] = useState(BROADCAST_SEGMENTS[0]!.key);
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, startSend] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const recipientCount = liveCounts[segment] ?? 0;

  function refresh() {
    startRefresh(async () => {
      const res = await getBroadcastCountsAction();
      if (res.success) setLiveCounts(res.data);
    });
  }

  function send() {
    const text = message.trim();
    if (!text) { toast.error("Message is required"); return; }
    if (recipientCount === 0) { toast.error("No recipients in this segment"); return; }
    setShowConfirm(true);
  }

  function executeSend() {
    setShowConfirm(false);
    startSend(async () => {
      const res = await sendBroadcastAction(segment, message.trim());
      if (res.success) {
        toast.success(`Broadcast queued — ${res.data.sent} sent, ${res.data.failed} failed`);
        setMessage("");
      } else {
        toast.error(res.message ?? "Broadcast failed");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <ConfirmModal
        open={showConfirm}
        title="Send SMS Broadcast"
        message={<>Send this SMS to <strong>{recipientCount} recipient(s)</strong>? This will be sent immediately and cannot be undone.</>}
        confirmLabel="Yes, Send Broadcast"
        variant="warning"
        isPending={isSending}
        onConfirm={executeSend}
        onClose={() => setShowConfirm(false)}
      />
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
        <Info size={15} weight="fill" className="mt-0.5 shrink-0" />
        <p>Broadcast sends one SMS to every recipient in the segment — this costs money per message. Double-check the text before sending.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Recipients</label>
        <div className="flex gap-2">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          >
            {BROADCAST_SEGMENTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({liveCounts[s.key] ?? 0})
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60"
          >
            {isRefreshing ? "…" : "Refresh"}
          </button>
        </div>
        <p className="text-xs text-gray-400">{recipientCount} recipient(s) will receive this SMS.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Type your campaign message…"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
        <p className="text-right text-xs text-gray-400">
          {message.length} chars · {segments(message.length)} SMS × {recipientCount} = {segments(message.length) * recipientCount} total
        </p>
      </div>

      <button
        onClick={send}
        disabled={isSending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSending ? <SpinnerGap size={16} className="animate-spin" /> : <Megaphone size={16} weight="fill" />}
        {isSending ? "Sending…" : `Send broadcast`}
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function SmsTemplatesClient({
  initial, counts, autoSmsEnabled,
}: {
  initial: SmsTemplate[];
  counts: Record<string, number>;
  autoSmsEnabled: boolean;
}) {
  const [templates, setTemplates] = useState(initial);
  const [tab, setTab] = useState<"templates" | "broadcast">("templates");
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(autoSmsEnabled);
  const [, startToggle] = useTransition();
  const [isTogglingAuto, startToggleAuto] = useTransition();

  function toggleAutoSms() {
    const next = !autoEnabled;
    startToggleAuto(async () => {
      const res = await setAutoSmsEnabledAction(next);
      if (res.success) {
        setAutoEnabled(next);
        toast.success(next ? "Automatic SMS turned on" : "Automatic SMS turned off");
      } else {
        toast.error(res.message ?? "Failed to update setting");
      }
    });
  }

  const bySection = useMemo(() => {
    const map: Record<string, SmsTemplate[]> = {};
    for (const t of templates) (map[t.section] ??= []).push(t);
    return map;
  }, [templates]);

  function toggle(t: SmsTemplate) {
    startToggle(async () => {
      const res = await toggleSmsTemplateAction(t.eventType);
      if (res.success) {
        setTemplates((prev) => prev.map((x) => (x.eventType === t.eventType ? res.data : x)));
        toast.success(res.data.isEnabled ? "Template enabled" : "Template disabled");
      } else {
        toast.error(res.message ?? "Failed to toggle");
      }
    });
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
          <ChatText size={18} weight="fill" className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-sm text-gray-500">Editable SMS for each event, plus bulk broadcast.</p>
        </div>
      </div>

      <div
        className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border p-4 ${
          autoEnabled ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"
        }`}
      >
        <div>
          <p className={`text-sm font-semibold ${autoEnabled ? "text-green-700" : "text-amber-700"}`}>
            Automatic SMS is {autoEnabled ? "ON" : "OFF"}
          </p>
          <p className={`text-xs ${autoEnabled ? "text-green-600" : "text-amber-700"}`}>
            {autoEnabled
              ? "Event-triggered SMS (welcome, payment, certificates, reminders, etc.) send normally."
              : "Event-triggered SMS is paused — nothing auto-sends except login/password-reset OTP. Manual broadcasts and Student Filters sends still work."}
          </p>
        </div>
        <button
          onClick={toggleAutoSms}
          disabled={isTogglingAuto}
          title={autoEnabled ? "Turn off automatic SMS" : "Turn on automatic SMS"}
          className={autoEnabled ? "text-green-600" : "text-gray-300"}
        >
          {autoEnabled ? <ToggleRight size={30} weight="fill" /> : <ToggleLeft size={30} weight="fill" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {([["templates", "Templates"], ["broadcast", "Broadcast"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "broadcast" ? (
        <BroadcastTab counts={counts} />
      ) : (
        <div className="space-y-8">
          {SECTION_META.map((section) => {
            const list = bySection[section.key] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={section.key}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {section.label}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((t) => (
                    <div
                      key={t.eventType}
                      className={`rounded-2xl border bg-white p-4 ${t.isEnabled ? "border-gray-100" : "border-gray-100 opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                          <p className="font-mono text-[11px] text-gray-400">{t.eventType}</p>
                        </div>
                        <button
                          onClick={() => toggle(t)}
                          title={t.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                          className={t.isEnabled ? "text-green-500" : "text-gray-300"}
                        >
                          {t.isEnabled ? <ToggleRight size={26} weight="fill" /> : <ToggleLeft size={26} weight="fill" />}
                        </button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{t.body}</p>
                      <button
                        onClick={() => setEditing(t)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        <PencilSimple size={13} weight="fill" /> Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => setTemplates((prev) => prev.map((x) => (x.eventType === t.eventType ? t : x)))}
        />
      )}
    </div>
  );
}
