"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Trash2, Plus } from "lucide-react";
import { notesApiBrowser, type Note } from "@/features/learn/api/notes/browser";
import { liveCurriculumApiBrowser } from "@/features/live-courses/api/browser";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LessonNotes({ lessonId, variant = "recorded" }: { lessonId: number; variant?: "recorded" | "live" }) {
  const api = variant === "live" ? liveCurriculumApiBrowser.notes : notesApiBrowser;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .list(lessonId)
      .then((res) => {
        if (!cancelled) setNotes(res.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load notes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, variant]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await api.create(lessonId, content);
        setNotes((prev) => [res.data, ...prev]);
        setText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save note");
      }
    });
  }

  function handleDelete(noteId: number) {
    setDeletingId(noteId);
    startTransition(async () => {
      try {
        await api.remove(lessonId, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete note");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div>
      {/* Add note */}
      <form onSubmit={handleAdd} className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Jot down a note for this lesson…"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-black/30 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
        <div className="mt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
          >
            {isPending && deletingId === null ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add Note
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <p className="py-2 text-sm text-gray-500">No notes yet for this lesson.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-black/20"
            >
              <div className="min-w-0">
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-gray-200">
                  {note.content}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">{relativeTime(note.createdAt)}</p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={deletingId === note.id}
                className="flex-shrink-0 text-gray-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                title="Delete note"
              >
                {deletingId === note.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
