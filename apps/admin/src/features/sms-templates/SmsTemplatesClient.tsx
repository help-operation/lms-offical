"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import {
  ChatText, PencilSimple, PaperPlaneTilt, SpinnerGap,
  X, Megaphone, ToggleLeft, ToggleRight, Info, Plus, Trash,
  MagnifyingGlass,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <ChatText size={18} weight="fill" className="text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SMS Templates</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button onClick={() => setLang("en")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${lang === "en" ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>EN</button>
            <button onClick={() => setLang("bn")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${lang === "bn" ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>বাং</button>
          </div>
          <button onClick={() => { setCreating(true); setEditing(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={15} weight="fill" /> New Template
          </button>
        </div>
      </div>

      {/* Auto SMS + Guide — single bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
        <button onClick={toggleAutoSms} disabled={isTogglingAuto} className={`shrink-0 ${autoEnabled ? "text-green-600" : "text-gray-300"}`} title={autoEnabled ? "Turn off" : "Turn on"}>
          {autoEnabled ? <ToggleRight size={26} weight="fill" /> : <ToggleLeft size={26} weight="fill" />}
        </button>
        <span className={`text-sm font-medium ${autoEnabled ? "text-green-700" : "text-amber-600"}`}>
          Auto SMS: {autoEnabled ? "ON" : "OFF"}
        </span>
        <span className="text-gray-200">|</span>
        <Info size={14} className="shrink-0 text-gray-400" />
        <p className="text-xs text-gray-400 truncate">
          {lang === "bn"
            ? "ইভেন্ট-ট্রিগার্ড SMS — সাইনআপ, পেমেন্ট, সার্টিফিকেট ইত্যাদিতে অটো পাঠায়। {{variable}} ব্যবহার করুন। বাংলা: 70 chars/SMS, ইংরেজি: 160 chars/SMS।"
            : "Event-triggered SMS — auto-sends on signup, payment, certificates, etc. Use {{variable}} for dynamic content. Bengali: 70 chars/SMS, English: 160 chars/SMS."}
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-2">
        {([["templates", "Templates"], ["broadcast", "Broadcast"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
        {tab === "templates" && (
          <>
            <span className="text-gray-200 mx-1">|</span>
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400">
              <option value="all">All Sections</option>
              {SECTION_META.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </>
        )}
      </div>

      {tab === "broadcast" ? (
        <BroadcastTab counts={counts} />
      ) : (
        /* Template table */
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_90px_90px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            <span>Template</span>
            <span>Event Type</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {SECTION_META.map((section) => {
            const list = filteredBySection[section.key] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={section.key}>
                {/* Section group header */}
                <div className="flex items-center gap-2 border-b border-gray-50 bg-gray-50/50 px-4 py-2">
                  <span className="text-xs font-semibold text-gray-500">{section.label}</span>
                  <span className="text-[11px] text-gray-300">({list.length})</span>
                  <span className="text-[11px] text-gray-300 ml-auto hidden sm:inline">{lang === "bn" ? section.descriptionbn : section.description}</span>
                </div>

                {list.map((t) => (
                  <div key={t.eventType} className={`group grid grid-cols-[1fr_160px_90px_90px] gap-3 items-center border-b border-gray-50 px-4 py-2.5 hover:bg-gray-50/50 transition-colors ${!t.isEnabled ? "opacity-50" : ""}`}>
                    {/* Name + body preview */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.body}</p>
                    </div>
                    {/* Event type */}
                    <span className="font-mono text-xs text-gray-400 truncate">{t.eventType}</span>
                    {/* Toggle */}
                    <div className="flex justify-center">
                      <button onClick={() => toggle(t)} title={t.isEnabled ? "Disable" : "Enable"} className={t.isEnabled ? "text-green-500" : "text-gray-300"}>
                        {t.isEnabled ? <ToggleRight size={24} weight="fill" /> : <ToggleLeft size={24} weight="fill" />}
                      </button>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(t); setCreating(false); }} className="rounded-md p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                        <PencilSimple size={14} weight="fill" />
                      </button>
                      <button onClick={() => setDeleting(t)} className="rounded-md p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                        <Trash size={14} weight="fill" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="py-10 text-center text-xs text-gray-400">
              {search || sectionFilter !== "all" ? "No templates match your search." : "No templates yet."}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {creating && <TemplateModal template={null} onClose={() => setCreating(false)} onSaved={handleSaved} />}
      {editing && <TemplateModal template={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      <ConfirmModal open={!!deleting} title="Delete Template" message={<>Delete <strong>{deleting?.name}</strong>? This cannot be undone.</>} confirmLabel="Delete" variant="danger" onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </div>
  );
}
