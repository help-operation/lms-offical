"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Plus, Trash2, Loader2, Upload, Clock, ChevronDown, Check,
  Pencil, Video, FileText, HelpCircle, ClipboardList, Sparkles,
} from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import type { Lesson, LessonType } from "@/features/courses/api";
import {
  assessmentsBrowserApi,
  type LessonResource,
} from "@/features/courses/api/assessments/browser";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import type { MediaFile } from "@/features/media/types";

const ALL_LESSON_TYPES: LessonType[] = ["video", "text", "quiz", "assignment"];

const CONTENT_LABEL: Record<LessonType, string> = {
  video: "Video Description",
  text: "Content",
  quiz: "Quiz Description",
  assignment: "Assignment Description",
};

const CONTENT_HINT: Record<LessonType, string> = {
  video: "Saved with the lesson — not shown anywhere yet.",
  text: "The full article / reading content for this lesson.",
  quiz: "Quiz instructions or question definitions.",
  assignment: "Assignment brief and submission instructions.",
};

const TYPE_META: Record<
  LessonType,
  { icon: React.ComponentType<{ className?: string }>; label: string; text: string; bg: string; ring: string }
> = {
  video: { icon: Video, label: "Video", text: "text-indigo-600 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-500/15", ring: "ring-indigo-400 dark:ring-indigo-500" },
  text: { icon: FileText, label: "Text", text: "text-blue-600 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-500/15", ring: "ring-blue-400 dark:ring-blue-500" },
  quiz: { icon: HelpCircle, label: "Quiz", text: "text-amber-600 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-500/15", ring: "ring-amber-400 dark:ring-amber-500" },
  assignment: { icon: ClipboardList, label: "Assignment", text: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-400 dark:ring-emerald-500" },
};

function TypeSelect({
  value,
  onChange,
  options,
}: {
  value: LessonType;
  onChange: (t: LessonType) => void;
  options: LessonType[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const meta = TYPE_META[value];
  const Icon = meta.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-slate-100 border rounded-xl pl-2.5 pr-3 py-2.5 bg-white dark:bg-slate-800 transition-shadow ${
          open ? `ring-2 ${meta.ring} border-transparent` : "border-gray-300 dark:border-slate-700"
        }`}
      >
        <span className={`flex items-center justify-center h-6 w-6 rounded-md shrink-0 ${meta.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${meta.text}`} />
        </span>
        <span className="flex-1 text-left">{meta.label}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1.5 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden py-1">
          {options.map((t) => {
            const optMeta = TYPE_META[t];
            const OptIcon = optMeta.icon;
            const selected = t === value;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  selected ? `${optMeta.bg} ${optMeta.text} font-medium` : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/60"
                }`}
              >
                <OptIcon className={`h-3.5 w-3.5 ${selected ? optMeta.text : "text-gray-400 dark:text-slate-500"}`} />
                <span className="flex-1">{optMeta.label}</span>
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface LessonEditModalProps {
  lesson: Lesson;
  disabled: boolean;
  onSave: (data: {
    title: string;
    type: LessonType;
    content: string;
    isFree: boolean;
    duration: number;
  }) => void;
  onClose: () => void;
  /** Lesson types offered in the Type picker (default: all). */
  lessonTypes?: LessonType[];
  /** Show the free-preview checkbox (default: true). */
  showFree?: boolean;
  /** Show the Resources/Downloads section (default: true). */
  showResources?: boolean;
}

export function LessonEditModal({
  lesson,
  disabled,
  onSave,
  onClose,
  lessonTypes = ALL_LESSON_TYPES,
  showFree = true,
  showResources = true,
}: LessonEditModalProps) {
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<LessonType>(lesson.type);
  const [content, setContent] = useState(lesson.content ?? "");
  const [isFree, setIsFree] = useState(lesson.isFree);

  function submit() {
    if (!title.trim()) return;
    // Duration is auto-detected from the video (Bunny transcode / external
    // metadata) elsewhere in the builder — never entered by hand here.
    onSave({ title: title.trim(), type, content, isFree, duration: lesson.duration ?? 0 });
  }

  function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-brand-50/70 via-white to-white dark:from-brand-500/10 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-200 dark:shadow-brand-950">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">Edit Lesson</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">Update details for this lesson</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div className={`grid gap-3 ${showFree ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Type</label>
              <TypeSelect value={type} onChange={setType} options={lessonTypes} />
            </div>

            {showFree && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Access</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFree}
                  onClick={() => setIsFree((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-slate-200 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 h-[42px] transition-colors"
                >
                  <span className="font-medium truncate">Free preview</span>
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isFree ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-600"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isFree ? "translate-x-[18px]" : "translate-x-1"}`} />
                  </span>
                </button>
              </div>
            )}
          </div>

          {type === "video" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Duration</label>
              {lesson.videoSource === "bunny" && lesson.bunnyStatus === "processing" ? (
                <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Detecting duration…
                </div>
              ) : lesson.duration ? (
                <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">{formatDuration(lesson.duration)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto dark:text-emerald-300 dark:bg-emerald-500/20">
                    <Sparkles className="h-3 w-3" /> Auto-detected
                  </span>
                </div>
              ) : lesson.videoSource ? (
                <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Duration unavailable for this video
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-100 border-dashed rounded-xl px-3 py-2.5 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-300">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Add a video to auto-detect duration
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{CONTENT_LABEL[type]}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full text-sm leading-relaxed border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 focus:border-transparent resize-y min-h-[100px] transition-shadow placeholder:text-gray-400 dark:placeholder:text-slate-500 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent] dark:[scrollbar-color:#475569_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-slate-500"
              placeholder={CONTENT_HINT[type]}
            />
          </div>

          {showResources && (
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <LessonResources lessonId={lesson.id} maxResources={type === "video" ? 1 : undefined} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !title.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const RESOURCE_TYPES = ["link", "pdf", "zip", "doc", "slides", "code"];

function LessonResources({ lessonId, maxResources }: { lessonId: number; maxResources?: number }) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LessonResource | null>(null);

  const [rTitle, setRTitle] = useState("");
  const [rType, setRType] = useState("link");
  const [rUrl, setRUrl] = useState("");
  const [rContent, setRContent] = useState("");

  useEffect(() => {
    setError(null);
    assessmentsBrowserApi
      .listResources(lessonId)
      .then((res) => setResources(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load resources"))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function add() {
    if (!rTitle.trim()) return;
    if (rType === "code" ? !rUrl.trim() && !rContent.trim() : !rUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await assessmentsBrowserApi.addResource(lessonId, {
        title: rTitle.trim(),
        type: rType,
        url: rUrl.trim() || null,
        content: rType === "code" ? rContent.trim() || null : null,
      });
      setResources((prev) => [...prev, res.data]);
      setRTitle("");
      setRUrl("");
      setRContent("");
      setRType("link");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add resource");
    } finally {
      setBusy(false);
    }
  }

  async function addFromUpload(file: MediaFile) {
    setBusy(true);
    setError(null);
    try {
      const res = await assessmentsBrowserApi.addResource(lessonId, {
        title: rTitle.trim() || file.originalName,
        type: rType,
        url: file.url,
        content: null,
      });
      setResources((prev) => [...prev, res.data]);
      setRTitle("");
      setRUrl("");
      setRType("link");
      setShowUpload(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add resource");
    } finally {
      setBusy(false);
    }
  }

  async function remove(resource: LessonResource) {
    setDeleteTarget(null);
    try {
      await assessmentsBrowserApi.deleteResource(resource.id);
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-3">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Resource"
        message={deleteTarget ? <>Delete resource <strong>"{deleteTarget.title}"</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={busy}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">Resources / Downloads</h4>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {resources.length > 0 && (
            <ul className="space-y-1.5">
              {resources.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 dark:bg-slate-800/60 dark:border-slate-700"
                >
                  <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-slate-500 w-12 shrink-0">
                    {r.type}
                  </span>
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-brand-600 dark:text-brand-300 hover:underline truncate"
                    >
                      {r.title}
                    </a>
                  ) : (
                    <span className="flex-1 text-gray-700 dark:text-slate-300 truncate">{r.title}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(r)}
                    className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {maxResources && resources.length >= maxResources ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Only {maxResources} resource allowed for video lessons. Delete the existing one to replace it.
            </p>
          ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={rTitle}
                onChange={(e) => setRTitle(e.target.value)}
                placeholder="Title"
                className="flex-1 min-w-[120px] text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
              />
              <div className="relative">
                <select
                  value={rType}
                  onChange={(e) => setRType(e.target.value)}
                  className="appearance-none text-sm font-medium text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1.5 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-800 capitalize cursor-pointer"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
              </div>
              <button
                type="button"
                onClick={add}
                disabled={busy || !rTitle.trim() || !rUrl.trim()}
                className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-2 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={rUrl}
                onChange={(e) => setRUrl(e.target.value)}
                placeholder={rType === "code" ? "GitHub / Gist URL (optional)…" : "Paste a URL…"}
                className="flex-1 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
              />
              {rType !== "code" && (
                <button
                  type="button"
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 dark:text-brand-300 dark:border-brand-500/30 dark:hover:bg-brand-500/10 transition-colors whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload File
                </button>
              )}
            </div>

            {rType === "code" && (
              <textarea
                value={rContent}
                onChange={(e) => setRContent(e.target.value)}
                rows={5}
                placeholder="Paste your code snippet here…"
                className="w-full text-xs font-mono border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 resize-y bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            )}
          </div>
          )}

          {showUpload && (
            <MediaLibraryModal
              onClose={() => setShowUpload(false)}
              onSelect={(file) => addFromUpload(file)}
            />
          )}
        </>
      )}
    </div>
  );
}
