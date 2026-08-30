"use client";

import { useState, useTransition } from "react";
import {
  EnvelopeSimple, PencilSimple, SpinnerGap, CheckCircle,
  FloppyDisk, X, Eye, PaperPlaneTilt, ToggleLeft, ToggleRight,
  Warning, Lock,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import {
  toggleEmailTemplateAction,
  updateEmailTemplateAction,
  sendTestEmailAction,
} from "./actions";
import { EVENT_META, type EmailTemplate, type TemplateVariable } from "./types";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  template,
  onClose,
  onSaved,
}: {
  template: EmailTemplate;
  onClose: () => void;
  onSaved: (t: EmailTemplate) => void;
}) {
  const [subject,  setSubject]  = useState(template.subject);
  const [htmlBody, setHtmlBody] = useState(template.htmlBody);
  const [tab,      setTab]      = useState<"edit" | "preview">("edit");
  const [testEmail, setTestEmail] = useState("");
  const [isPending,  startTransition]  = useTransition();
  const [isTesting,  startTest]        = useTransition();

  const vars: TemplateVariable[] = (() => {
    try { return JSON.parse(template.variables); } catch { return []; }
  })();

  function handleSave() {
    startTransition(async () => {
      const res = await updateEmailTemplateAction(template.eventType, { subject, htmlBody });
      if (res.success) {
        toast.success("Template saved");
        onSaved(res.data);
        onClose();
      } else {
        toast.error(res.message ?? "Save failed");
      }
    });
  }

  function handleTest() {
    if (!testEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    startTest(async () => {
      const res = await sendTestEmailAction(template.eventType, testEmail);
      if (res.success) {
        toast.success(res.data.sent ? "Test email sent!" : "Dev mode — email logged to console");
      } else {
        toast.error(res.message ?? "Send failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{template.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{template.eventType}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-6">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === "edit" ? (
            <>
              {/* Variables reference */}
              {vars.length > 0 && (
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                  <p className="text-xs font-semibold text-brand-700 mb-2">Available Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {vars.map((v) => (
                      <span key={v.key} title={v.description} className="inline-flex items-center gap-1 rounded-lg bg-white border border-brand-200 px-2.5 py-1 text-xs font-mono text-brand-700 cursor-default">
                        {v.key}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-brand-500 mt-2">Hover a variable to see its description. Copy and paste into subject or body.</p>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                />
              </div>

              {/* HTML Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  HTML Body
                  <span className="ml-2 text-gray-400 font-normal">(raw HTML — use variables like {`{{student_name}}`})</span>
                </label>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-mono focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition resize-y"
                />
              </div>
            </>
          ) : (
            /* Preview */
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Subject:</span> {subject}
                </p>
              </div>
              <div
                className="p-4"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </div>
          )}

          {/* Test send */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <PaperPlaneTilt size={13} weight="fill" className="text-gray-400" />
              Send Test Email
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
              />
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 transition"
              >
                {isTesting ? <SpinnerGap size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 transition"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onToggled,
}: {
  template: EmailTemplate;
  onEdit: () => void;
  onToggled: (t: EmailTemplate) => void;
}) {
  const [isToggling, startToggle] = useTransition();
  const meta = EVENT_META[template.eventType];
  const isCritical = meta?.critical ?? false;

  function handleToggle() {
    startToggle(async () => {
      const res = await toggleEmailTemplateAction(template.eventType);
      if (res.success) {
        onToggled(res.data);
        toast.success(res.data.isEnabled ? "Template enabled" : "Template disabled");
      } else {
        toast.error(res.message ?? "Failed");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl shrink-0 ${meta?.color ?? "bg-gray-100"}`}>
            {meta?.icon ?? "📧"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">{template.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                template.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {template.isEnabled ? "Enabled" : "Disabled"}
              </span>
              {isCritical && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                  Required
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{template.eventType}</p>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{meta?.description}</p>
            <p className="text-xs text-gray-400 mt-2">
              <span className="font-medium text-gray-600">Subject:</span> {template.subject}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCritical ? (
            <span
              title="This is a required system email and cannot be disabled."
              className="flex items-center justify-center text-amber-400"
            >
              <Lock size={20} weight="fill" />
            </span>
          ) : (
            <button
              onClick={handleToggle}
              disabled={isToggling}
              title={template.isEnabled ? "Disable" : "Enable"}
              className="flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-50 transition"
            >
              {isToggling ? (
                <SpinnerGap size={22} className="animate-spin" />
              ) : template.isEnabled ? (
                <ToggleRight size={28} weight="fill" className="text-green-500" />
              ) : (
                <ToggleLeft size={28} className="text-gray-300" />
              )}
            </button>
          )}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <PencilSimple size={13} weight="bold" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function EmailTemplatesClient({ initial }: { initial: EmailTemplate[] }) {
  const [templates, setTemplates] = useState(initial);
  const [editing,   setEditing]   = useState<EmailTemplate | null>(null);

  function handleToggled(updated: EmailTemplate) {
    setTemplates((prev) => prev.map((t) => t.eventType === updated.eventType ? updated : t));
  }

  function handleSaved(updated: EmailTemplate) {
    setTemplates((prev) => prev.map((t) => t.eventType === updated.eventType ? updated : t));
  }

  const enabledCount = templates.filter((t) => t.isEnabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all transactional emails — verification, enrollments, certificates and more
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <EnvelopeSimple size={20} weight="fill" className="text-brand-600" />
        </div>
      </div>

      {/* Summary banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4">
        <CheckCircle size={20} weight="fill" className="text-brand-600 shrink-0" />
        <p className="text-sm text-brand-700">
          <span className="font-bold">{enabledCount}</span> of <span className="font-bold">{templates.length}</span> templates enabled.
          {" "}Disabled templates are skipped silently — no email is sent for that event.
        </p>
      </div>

      {/* Template cards */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <EnvelopeSimple size={40} weight="thin" className="text-gray-300" />
            <p className="text-sm text-gray-400">No templates found. They will be seeded on next API restart.</p>
          </div>
        ) : (
          templates.map((tpl) => (
            <TemplateCard
              key={tpl.eventType}
              template={tpl}
              onEdit={() => setEditing(tpl)}
              onToggled={handleToggled}
            />
          ))
        )}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4">
        <Warning size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">SMTP delivery is configured</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Emails are sent over SMTP using <code className="bg-amber-100 px-1 rounded">EMAIL_HOST</code> / <code className="bg-amber-100 px-1 rounded">EMAIL_PORT</code> / <code className="bg-amber-100 px-1 rounded">EMAIL_USER</code> / <code className="bg-amber-100 px-1 rounded">EMAIL_PASS</code> env vars on the API server (defaults to Hostinger <code className="bg-amber-100 px-1 rounded">smtp.hostinger.com:465</code>).
            Make sure these are set for production use.
          </p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { handleSaved(updated); setEditing(null); }}
        />
      )}
    </div>
  );
}
