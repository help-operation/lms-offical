"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import {
  ChatText, PencilSimple, PaperPlaneTilt, SpinnerGap,
  X, Megaphone, ToggleLeft, ToggleRight, Info, Plus, Trash,
  MagnifyingGlass, FunnelSimple,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  createSmsTemplateAction,
  deleteSmsTemplateAction,
  getBroadcastCountsAction,
  sendBroadcastAction,
  sendTestSmsAction,
  setAutoSmsEnabledAction,
  toggleSmsTemplateAction,
  updateSmsTemplateAction,
} from "./actions";
import {
  SECTION_META, BROADCAST_SEGMENTS,
  type SmsTemplate, type TemplateVariable, type CreateTemplateInput,
} from "./types";

// ─── Bengali/English SMS segment calc ──────────────────────────────────────────

const BENGALI_RE = /[\u0980-\u09FF]/;

/** Count weighted chars: Bengali = 2 units, ASCII = 1 unit. */
function weightedLen(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += BENGALI_RE.test(ch) ? 2 : 1;
  }
  return w;
}

function smsSegments(text: string): number {
  if (!text) return 0;
  const w = weightedLen(text);
  if (w === 0) return 0;
  // GSM-7: 1 SMS = 153 chars (multipart), first segment 160. For weighted: use 153/160.
  if (w <= 153) return 1;
  return Math.ceil(w / 153);
}

function languageBadge(text: string): { label: string; color: string } {
  const hasBengali = BENGALI_RE.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  if (hasBengali && hasLatin) return { label: "Mixed", color: "bg-amber-100 text-amber-700" };
  if (hasBengali) return { label: "Bengali", color: "bg-blue-100 text-blue-700" };
  return { label: "English", color: "bg-green-100 text-green-700" };
}

function parseVars(json: string): TemplateVariable[] {
  try { return JSON.parse(json); } catch { return []; }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 100);
}

function detectVariables(body: string): TemplateVariable[] {
  const matches = [...body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)];
  const seen = new Set<string>();
  const vars: TemplateVariable[] = [];
  for (const m of matches) {
    const key = `{{${m[1]}}}`;
    if (!seen.has(key)) {
      seen.add(key);
      vars.push({ key, description: "" });
    }
  }
  return vars;
}

// ─── Create / Edit Modal ─────────────────────────────────────────────────────

function TemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: SmsTemplate | null;
  onClose: () => void;
  onSaved: (t: SmsTemplate) => void;
}) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [eventType, setEventType] = useState(template?.eventType ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!template);
  const [section, setSection] = useState(template?.section ?? SECTION_META[0]!.key);
  const [templateType] = useState(template?.templateType ?? "sms");
  const [body, setBody] = useState(template?.body ?? "");
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template ? parseVars(template.variables) : []
  );
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  const handleNameChange = useCallback((v: string) => {
    setName(v);
    if (!slugManuallyEdited) setEventType(slugify(v));
  }, [slugManuallyEdited]);

  const handleSlugChange = useCallback((v: string) => {
    setSlugManuallyEdited(true);
    setEventType(slugify(v));
  }, []);

  const detectedVars = useMemo(() => detectVariables(body), [body]);
  const badge = languageBadge(body);
  const segs = smsSegments(body);
  const wLen = weightedLen(body);

  function addVariable() {
    const key = newVarKey.trim();
    if (!key) return;
    const full = key.startsWith("{{") ? key : `{{${key}}}`;
    if (variables.some((v) => v.key === full)) {
      toast.error("Variable already exists");
      return;
    }
    setVariables((prev) => [...prev, { key: full, description: newVarDesc.trim() }]);
    setNewVarKey("");
    setNewVarDesc("");
  }

  function removeVariable(key: string) {
    setVariables((prev) => prev.filter((v) => v.key !== key));
  }

  function insertVariable(key: string) {
    setBody((b) => `${b}${key}`);
  }

  function save() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!eventType.trim()) { toast.error("Event type is required"); return; }
    if (!body.trim()) { toast.error("Message body is required"); return; }

    startSave(async () => {
      if (isEdit) {
        const res = await updateSmsTemplateAction(template!.eventType, { body, name });
        if (res.success) { toast.success("Template saved"); onSaved(res.data); onClose(); }
        else toast.error(res.message ?? "Save failed");
      } else {
        const input: CreateTemplateInput = {
          eventType,
          name: name.trim(),
          section,
          templateType,
          body,
          variables,
        };
        const res = await createSmsTemplateAction(input);
        if (res.success) { toast.success("Template created"); onSaved(res.data); onClose(); }
        else toast.error(res.message ?? "Create failed");
      }
    });
  }

  function sendTest() {
    if (!testPhone.trim()) { toast.error("Enter a phone number"); return; }
    startTest(async () => {
      const res = await sendTestSmsAction(isEdit ? template!.eventType : eventType, testPhone.trim());
      if (res.success) toast.success(res.data.sent ? "Test SMS sent!" : "Dev mode — SMS logged to console");
      else toast.error(res.message ?? "Send failed");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isEdit ? "Edit Template" : "Create New Template"}
            </h2>
            {isEdit && <p className="font-mono text-[11px] text-gray-400">{template.eventType}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="space-y-4 p-5">
          {/* Name + Event Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Template Name *</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Welcome SMS"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Event Type *</label>
              <input
                value={eventType}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. welcome_sms"
                disabled={isEdit}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            >
              {SECTION_META.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Template Type badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Type:</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
              <ChatText size={12} /> SMS
            </span>
          </div>

          {/* Body textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Message Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Type your SMS message... Use {{variable}} for dynamic content."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
            {/* Character info bar */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>{wLen} weighted chars</span>
                <span>·</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${segs > 1 ? "text-amber-600" : "text-gray-500"}`}>
                  {segs} SMS
                </span>
                {segs > 1 && (
                  <span className="text-amber-500">
                    ({segs} segments × 153 chars)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Variables</label>

            {/* Auto-detected from body */}
            {detectedVars.length > 0 && (
              <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
                <p className="mb-2 text-[11px] font-medium text-brand-700">
                  Detected in body — click to insert
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVars.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="rounded-lg border border-brand-200 bg-white px-2 py-1 font-mono text-[11px] text-brand-700 hover:bg-brand-100"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved variables list */}
            {variables.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-[11px] font-medium text-gray-600">Defined variables</p>
                <div className="space-y-1.5">
                  {variables.map((v) => (
                    <div key={v.key} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-1.5">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-brand-700">{v.key}</span>
                        {v.description && (
                          <span className="ml-2 text-[11px] text-gray-400">— {v.description}</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeVariable(v.key)}
                        className="ml-2 shrink-0 text-gray-300 hover:text-red-500"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add variable */}
            <div className="flex gap-2">
              <input
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                placeholder="Variable name"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-400"
                onKeyDown={(e) => e.key === "Enter" && addVariable()}
              />
              <input
                value={newVarDesc}
                onChange={(e) => setNewVarDesc(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-400"
                onKeyDown={(e) => e.key === "Enter" && addVariable()}
              />
              <button
                onClick={addVariable}
                className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </div>
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
          <button
            onClick={save}
            disabled={isSaving}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
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
  const badge = languageBadge(message);
  const segs = smsSegments(message);
  const wLen = weightedLen(message);

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
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>{wLen} weighted chars</span>
            <span>·</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <span className={`font-medium ${segs > 1 ? "text-amber-600" : ""}`}>
            {segs} SMS × {recipientCount} = {segs * recipientCount} total
          </span>
        </div>
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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SmsTemplate | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(autoSmsEnabled);
  const [, startToggle] = useTransition();
  const [isTogglingAuto, startToggleAuto] = useTransition();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [lang, setLang] = useState<"en" | "bn">("en");

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

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (sectionFilter !== "all") {
      list = list.filter((t) => t.section === sectionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.eventType.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, sectionFilter, search]);

  const filteredBySection = useMemo(() => {
    const map: Record<string, SmsTemplate[]> = {};
    for (const t of filteredTemplates) (map[t.section] ??= []).push(t);
    return map;
  }, [filteredTemplates]);

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

  function confirmDelete() {
    if (!deleting) return;
    const et = deleting.eventType;
    deleteSmsTemplateAction(et).then((res) => {
      if (res.success) {
        setTemplates((prev) => prev.filter((x) => x.eventType !== et));
        toast.success("Template deleted");
      } else {
        toast.error(res.message ?? "Delete failed");
      }
      setDeleting(null);
    });
  }

  function handleSaved(t: SmsTemplate) {
    if (creating) {
      setTemplates((prev) => [...prev, t]);
      setCreating(false);
    } else {
      setTemplates((prev) => prev.map((x) => (x.eventType === t.eventType ? t : x)));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
            <ChatText size={18} weight="fill" className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SMS Templates</h1>
            <p className="text-sm text-gray-500">Manage event-triggered SMS and bulk broadcast.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === "en" ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("bn")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === "bn" ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              বাং
            </button>
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} weight="fill" /> New Template
          </button>
        </div>
      </div>

      {/* Auto SMS toggle */}
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
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
      <div className="flex gap-2">
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
        <>
          {/* Usage guide */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-blue-500" />
              <div className="space-y-2 text-xs text-blue-700 leading-relaxed">
                <p className="font-semibold text-blue-800">
                  {lang === "bn" ? "কিভাবে কাজ করে" : "How it works"}
                </p>
                {lang === "bn" ? (
                  <>
                    <p>
                      প্রতিটি টেমপ্লেট একটি ইভেন্টের সাথে সম্পর্কিত — যেমন ব্যবহারকারী সাইন আপ করলে <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">welcome</code> SMS পাঠানো হয়।
                      টেমপ্লেটে <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">{"{{variable}}"}</code> ব্যবহার করে ডায়নামিক তথ্য পাঠানো যায়।
                    </p>
                    <p>
                      আপনি বাংলা বা ইংরেজি যেকোনো ভাষায় টেমপ্লেট লিখতে পারবেন। বাংলা অক্ষর দৈর্ঘ্য সিস্টেম বুঝে নিন —
                      বাংলায় 1 SMS = 70 ক্যারেক্টার, ইংরেজিতে 1 SMS = 160 ক্যারেক্টার।
                    </p>
                    <p>
                      "Automatic SMS" চালু থাকলে ইভেন্ট ঘটলে অটোমেটিক SMS পাঠানো হয়।
                      বন্ধ করলে শুধু OTP ছাড়া কোনো SMS পাঠানো হবে না।
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Each template is tied to an event — e.g. when a user signs up, the <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">welcome</code> SMS is sent automatically.
                      Use <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">{"{{variable}}"}</code> syntax to insert dynamic content like names, amounts, and links.
                    </p>
                    <p>
                      You can write templates in Bengali or English. Note the character limits —
                      Bengali SMS: 70 chars/SMS, English SMS: 160 chars/SMS. The counter below the textarea shows the weighted count.
                    </p>
                    <p>
                      When "Automatic SMS" is ON, event-triggered messages send automatically.
                      Turn it OFF to pause all auto-sends (OTP always works regardless).
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <FunnelSimple size={14} className="text-gray-400" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="all">All Sections</option>
                {SECTION_META.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Template grid by section */}
          <div className="space-y-8">
            {SECTION_META.map((section) => {
              const list = filteredBySection[section.key] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={section.key}>
                  <div className="mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {section.label}
                      <span className="ml-2 text-gray-300">({list.length})</span>
                    </h2>
                    <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                      {lang === "bn" ? section.descriptionbn : section.description}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {list.map((t) => (
                      <div
                        key={t.eventType}
                        className={`group relative rounded-2xl border bg-white p-4 transition-all hover:shadow-sm ${
                          t.isEnabled ? "border-gray-100" : "border-gray-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                            <p className="font-mono text-[11px] text-gray-400">{t.eventType}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggle(t)}
                              title={t.isEnabled ? "Enabled — click to disable" : "Disabled — click to enable"}
                              className={t.isEnabled ? "text-green-500" : "text-gray-300"}
                            >
                              {t.isEnabled ? <ToggleRight size={26} weight="fill" /> : <ToggleLeft size={26} weight="fill" />}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">{t.body}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => { setEditing(t); setCreating(false); }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            <PencilSimple size={13} weight="fill" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleting(t)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash size={13} weight="fill" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredTemplates.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                {search || sectionFilter !== "all"
                  ? "No templates match your search."
                  : "No templates yet. Create one to get started."}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {creating && (
        <TemplateModal
          template={null}
          onClose={() => setCreating(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <TemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleting}
        title="Delete Template"
        message={
          <>
            Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
            Any code referencing this event type will no longer send SMS.
          </>
        }
        confirmLabel="Delete Template"
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
