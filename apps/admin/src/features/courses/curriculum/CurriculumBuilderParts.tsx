"use client";

import { useState } from "react";
import { Plus, Video } from "lucide-react";
import type { Lesson, LessonType } from "@/features/courses/api";

export const LESSON_TYPES: LessonType[] = ["video", "text", "quiz", "assignment"];

export function AddLessonRow({
  onAdd,
  disabled,
  lessonTypes = LESSON_TYPES,
  showFree = true,
}: {
  onAdd: (data: { title: string; type: LessonType; isFree: boolean }) => void;
  disabled: boolean;
  lessonTypes?: LessonType[];
  showFree?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LessonType>(lessonTypes[0] ?? "video");
  const [isFree, setIsFree] = useState(false);

  function submit() {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), type, isFree });
    setTitle("");
    setType(lessonTypes[0] ?? "video");
    setIsFree(false);
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 px-8 py-3 w-full hover:bg-indigo-50 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Lesson
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-8 py-3 bg-indigo-50">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setAdding(false); }}
        placeholder="Lesson title…"
        className="flex-1 text-sm bg-white border border-indigo-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as LessonType)}
        className="text-sm bg-white border border-indigo-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 capitalize"
      >
        {lessonTypes.map((t) => (
          <option key={t} value={t} className="capitalize">{t}</option>
        ))}
      </select>
      {showFree && (
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="rounded"
          />
          Free preview
        </label>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !title.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => { setAdding(false); setTitle(""); }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}

// ── VideoStatusBadge ─────────────────────────────────────────────────────────

export function VideoStatusBadge({ lesson }: { lesson: Lesson }) {
  if (lesson.type !== "video") return null;

  if (lesson.videoSource === "external") {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        External
      </span>
    );
  }

  if (lesson.videoSource === "bunny") {
    const map: Record<string, { label: string; cls: string }> = {
      processing: { label: "Processing", cls: "bg-yellow-100 text-yellow-700" },
      ready:      { label: "Ready",      cls: "bg-green-100 text-green-700"  },
      failed:     { label: "Failed",     cls: "bg-red-100 text-red-700"      },
    };
    const info = lesson.bunnyStatus ? map[lesson.bunnyStatus] : null;
    if (!info) return null;
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.cls}`}>
        {info.label}
      </span>
    );
  }

  return null;
}
