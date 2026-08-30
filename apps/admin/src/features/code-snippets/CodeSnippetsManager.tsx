"use client";

import { useRef, useState, useTransition } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  Code,
  Globe,
  FileText,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
  CaretDown,
  X,
  Copy,
  DownloadSimple,
  UploadSimple,
  Eraser,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import {
  createCodeSnippetAction,
  updateCodeSnippetAction,
  deleteCodeSnippetAction,
} from "./actions";
import type { CodeSnippet, SnippetLocation, SnippetScope, CreateSnippetInput } from "./api";

// ─── helpers ──────────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<SnippetLocation, string> = {
  head:       "Head",
  body_start: "Body Start",
  body_end:   "Body End",
};

const LOCATION_COLORS: Record<SnippetLocation, string> = {
  head:       "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  body_start: "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20",
  body_end:   "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
};

const SCOPE_LABELS: Record<SnippetScope, string> = {
  global:   "All pages",
  specific: "Specific pages",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300";

const INLINE_CODE_CLASS = "rounded bg-gray-100 px-1 text-[11px] text-gray-700 dark:bg-slate-700 dark:text-gray-300";

// ─── Code editor field (line numbers, copy/clear/import/export, fullscreen) ────

const EDITOR_TOOLBAR_BTN =
  "flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-100";

function CodeEditorField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = Math.max(value.split("\n").length, 1);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  function syncScroll() {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  function handleCopy() {
    if (!value.trim()) { toast.error("Nothing to copy"); return; }
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success("Code copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  }

  function handleClear() {
    if (!value.trim()) return;
    if (window.confirm("Clear all code in this field? This cannot be undone.")) {
      onChange("");
    }
  }

  function handleExport() {
    if (!value.trim()) { toast.error("Nothing to export"); return; }
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snippet.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className={fullscreen ? "modal-panel-in fixed inset-0 z-[60] flex flex-col bg-white p-4 dark:bg-slate-900 sm:p-6" : ""}>
      {/* Toolbar */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {lineCount} line{lineCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-0.5">
          <label className={`${EDITOR_TOOLBAR_BTN} cursor-pointer`} title="Import from file">
            <UploadSimple size={14} />
            <input type="file" accept=".txt,.html,.htm,.js,.css" className="hidden" onChange={handleImport} />
          </label>
          <button type="button" onClick={handleExport} title="Export as file" className={EDITOR_TOOLBAR_BTN}>
            <DownloadSimple size={14} />
          </button>
          <button type="button" onClick={handleCopy} title="Copy code" className={EDITOR_TOOLBAR_BTN}>
            <Copy size={14} />
          </button>
          <button type="button" onClick={handleClear} title="Clear code" className={EDITOR_TOOLBAR_BTN}>
            <Eraser size={14} />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            className={EDITOR_TOOLBAR_BTN}
          >
            {fullscreen ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className={`flex overflow-hidden rounded-lg border border-gray-300 bg-gray-950 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-slate-700 ${fullscreen ? "flex-1" : ""}`}>
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none overflow-hidden border-r border-gray-800 bg-gray-900/60 px-2 py-3 text-right font-mono text-xs leading-relaxed text-gray-600"
        >
          {lines.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          rows={fullscreen ? undefined : 8}
          wrap="off"
          placeholder={placeholder}
          spellCheck={false}
          className={`flex-1 resize-y overflow-x-auto whitespace-pre bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-green-400 outline-none placeholder:text-gray-600 ${fullscreen ? "h-full resize-none" : ""}`}
        />
      </div>
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface ModalProps {
  snippet?: CodeSnippet | null;
  onClose: () => void;
  onSaved: (s: CodeSnippet) => void;
}

function SnippetModal({ snippet, onClose, onSaved }: ModalProps) {
  const isEdit = !!snippet;

  const [name,     setName]     = useState(snippet?.name     ?? "");
  const [code,     setCode]     = useState(snippet?.code     ?? "");
  const [location, setLocation] = useState<SnippetLocation>(snippet?.location ?? "head");
  const [scope,    setScope]    = useState<SnippetScope>(snippet?.scope ?? "global");
  const [pages,    setPages]    = useState<string[]>(snippet?.pages ?? []);
  const [pageInput,setPageInput]= useState("");
  const [isEnabled,setIsEnabled]= useState(snippet?.isEnabled ?? true);
  const [isPending, startTransition] = useTransition();

  function addPage() {
    const p = pageInput.trim().replace(/\s+/g, "");
    if (p && !pages.includes(p)) {
      setPages((prev) => [...prev, p]);
    }
    setPageInput("");
  }

  function removePage(p: string) {
    setPages((prev) => prev.filter((x) => x !== p));
  }

  function handleSubmit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!code.trim()) { toast.error("Code is required"); return; }

    const payload: CreateSnippetInput = {
      name:      name.trim(),
      code:      code.trim(),
      location,
      scope,
      pages:     scope === "specific" ? pages : [],
      isEnabled,
      order:     snippet?.order ?? 0,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateCodeSnippetAction(snippet!.id, payload)
        : await createCodeSnippetAction(payload);

      if (res.success) {
        toast.success(isEdit ? "Snippet updated" : "Snippet created");
        onSaved(res.data);
        onClose();
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm dark:bg-black/60 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel-in flex h-full w-full flex-col bg-white shadow-xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
              <Code size={16} weight="bold" className="text-white" />
            </div>
            <h2 className="truncate text-left text-base font-semibold text-gray-900 dark:text-white">
              {isEdit ? "Edit Snippet" : "Add Snippet"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {/* Name */}
          <div>
            <label className={LABEL_CLASS}>
              Snippet name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Google Analytics 4"
              className={INPUT_CLASS}
            />
          </div>

          {/* Location + Scope row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Location</label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as SnippetLocation)}
                  className={`${INPUT_CLASS} appearance-none pr-8`}
                >
                  <option value="head">Head</option>
                  <option value="body_start">Body Start</option>
                  <option value="body_end">Body End (Footer)</option>
                </select>
                <CaretDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Scope</label>
              <div className="relative">
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as SnippetScope)}
                  className={`${INPUT_CLASS} appearance-none pr-8`}
                >
                  <option value="global">All pages (Global)</option>
                  <option value="specific">Specific pages only</option>
                </select>
                <CaretDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>

          {/* Specific pages */}
          {scope === "specific" && (
            <div>
              <label className={LABEL_CLASS}>
                Page paths <span className="font-normal text-gray-400 dark:text-gray-500">(add one at a time)</span>
              </label>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPage(); }}}
                  placeholder="/courses, /blog, /"
                  className={`flex-1 ${INPUT_CLASS} py-2`}
                />
                <button
                  type="button"
                  onClick={addPage}
                  className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                >
                  Add
                </button>
              </div>
              {pages.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pages.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300"
                    >
                      {p}
                      <button
                        onClick={() => removePage(p)}
                        aria-label={`Remove ${p}`}
                        className="ml-1 rounded text-gray-400 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 dark:text-gray-500 dark:hover:text-gray-200"
                      >
                        <X size={10} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Enter exact paths like <code className={INLINE_CODE_CLASS}>/</code>,{" "}
                <code className={INLINE_CODE_CLASS}>/courses</code>,{" "}
                <code className={INLINE_CODE_CLASS}>/blog</code>. Prefix match — e.g.{" "}
                <code className={INLINE_CODE_CLASS}>/courses</code> matches all course pages.
              </p>
            </div>
          )}

          {/* Code */}
          <div>
            <label className={LABEL_CLASS}>
              Code <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <CodeEditorField
              value={code}
              onChange={setCode}
              placeholder={"<!-- Paste your full HTML, <script>, or <style> tag here -->"}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Paste the full tag — e.g. <code className={INLINE_CODE_CLASS}>&lt;script&gt;...&lt;/script&gt;</code>,{" "}
              <code className={INLINE_CODE_CLASS}>&lt;style&gt;...&lt;/style&gt;</code>, or a raw{" "}
              <code className={INLINE_CODE_CLASS}>&lt;meta&gt;</code> tag.
            </p>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={() => setIsEnabled((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                isEnabled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  isEnabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {isEnabled ? "Enabled — will be injected" : "Disabled — skipped on all pages"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:justify-end sm:px-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
          >
            {isPending ? <SpinnerGap size={14} className="animate-spin" /> : null}
            {isEdit ? "Update Snippet" : "Add Snippet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  snippet: CodeSnippet;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

function DeleteConfirm({ snippet, onClose, onDeleted }: DeleteConfirmProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCodeSnippetAction(snippet.id);
      if (res.success) {
        toast.success("Snippet deleted");
        onDeleted(snippet.id);
        onClose();
      } else {
        toast.error(res.message ?? "Failed to delete");
      }
    });
  }

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel-in w-full max-w-sm rounded-lg border border-gray-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/10">
            <WarningCircle size={18} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete snippet?</h3>
        </div>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-800 dark:text-gray-200">{snippet.name}</span> will be permanently deleted and
          removed from all pages.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
          >
            {isPending ? <SpinnerGap size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main manager ─────────────────────────────────────────────────────────────

interface Props {
  initial: CodeSnippet[];
}

export function CodeSnippetsManager({ initial }: Props) {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initial);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState<CodeSnippet | null>(null);
  const [deleting, setDeleting] = useState<CodeSnippet | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function handleSaved(s: CodeSnippet) {
    setSnippets((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = s;
        return next;
      }
      return [...prev, s];
    });
  }

  function handleDeleted(id: number) {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleToggle(snippet: CodeSnippet) {
    setTogglingId(snippet.id);
    const res = await updateCodeSnippetAction(snippet.id, { isEnabled: !snippet.isEnabled });
    setTogglingId(null);
    if (res.success) {
      handleSaved(res.data);
    } else {
      toast.error(res.message ?? "Failed to update");
    }
  }

  const enabledCount = snippets.filter((s) => s.isEnabled).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Code size={18} weight="fill" className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {enabledCount} of {snippets.length} snippet{snippets.length !== 1 ? "s" : ""} active
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              Snippets inject automatically into every matching page
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          <Plus size={15} weight="bold" />
          Add Snippet
        </button>
      </div>

      {/* Empty state */}
      {snippets.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/5">
            <Code size={24} weight="duotone" className="text-brand-500 dark:text-brand-300" />
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">No snippets yet</p>
          <p className="mx-auto mb-5 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Add HTML, script, or style snippets to inject them site-wide or on specific pages — perfect for analytics, pixels, or custom widgets.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-slate-900"
          >
            <Plus size={14} weight="bold" />
            Add first snippet
          </button>
        </div>
      )}

      {/* Snippet list */}
      {snippets.length > 0 && (
        <div className="space-y-3">
          {snippets.map((snippet, idx) => (
            <div
              key={snippet.id}
              style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
              className={`list-item-in rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20 sm:p-5 ${
                snippet.isEnabled ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(snippet)}
                  disabled={togglingId === snippet.id}
                  role="switch"
                  aria-checked={snippet.isEnabled}
                  aria-label={`${snippet.isEnabled ? "Disable" : "Enable"} ${snippet.name}`}
                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${
                    snippet.isEnabled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-700"
                  }`}
                >
                  {togglingId === snippet.id ? (
                    <SpinnerGap size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
                  ) : (
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        snippet.isEnabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{snippet.name}</span>

                    {/* Location badge */}
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LOCATION_COLORS[snippet.location]}`}
                    >
                      {LOCATION_LABELS[snippet.location]}
                    </span>

                    {/* Scope badge */}
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400">
                      {snippet.scope === "global" ? (
                        <Globe size={9} weight="fill" />
                      ) : (
                        <FileText size={9} weight="fill" />
                      )}
                      {SCOPE_LABELS[snippet.scope]}
                    </span>

                    {/* Active badge */}
                    {snippet.isEnabled && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                        <CheckCircle size={9} weight="fill" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Page paths */}
                  {snippet.scope === "specific" && snippet.pages.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {snippet.pages.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Code preview */}
                  <div className="group/code relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(snippet.code)
                          .then(() => toast.success("Code copied to clipboard"))
                          .catch(() => toast.error("Failed to copy"));
                      }}
                      aria-label="Copy code"
                      title="Copy code"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-gray-900/80 text-gray-400 opacity-0 transition-opacity hover:text-gray-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-500 group-hover/code:opacity-100"
                    >
                      <Copy size={12} />
                    </button>
                    <pre className="line-clamp-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 pr-9 text-[11px] font-mono text-gray-400">
                      {snippet.code.slice(0, 200)}{snippet.code.length > 200 ? "…" : ""}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setEditing(snippet)}
                    aria-label={`Edit ${snippet.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-gray-400 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 sm:h-8 sm:w-8"
                  >
                    <PencilSimple size={14} weight="bold" />
                  </button>
                  <button
                    onClick={() => setDeleting(snippet)}
                    aria-label={`Delete ${snippet.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-slate-700 dark:text-gray-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:h-8 sm:w-8"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <SnippetModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <SnippetModal
          snippet={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirm
          snippet={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
