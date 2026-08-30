"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  FileText,
  Loader2,
  NotebookPen,
  Pencil,
  Radio,
  Trash2,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { DataTable, type Column } from "@repo/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import type { AllNotesEntry } from "@/features/learn/api/notes";
import { notesApiBrowser } from "@/features/learn/api/notes/browser";
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

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
      <Radio className="h-3 w-3" />
      Live
    </span>
  );
}

function updateNote(note: AllNotesEntry, content: string) {
  return note.source === "live"
    ? liveCurriculumApiBrowser.notes.update(note.lessonId, note.id, content)
    : notesApiBrowser.update(note.lessonId, note.id, content);
}

function removeNote(note: AllNotesEntry) {
  return note.source === "live"
    ? liveCurriculumApiBrowser.notes.remove(note.lessonId, note.id)
    : notesApiBrowser.remove(note.lessonId, note.id);
}

export function NotesTable({ notes }: { notes: AllNotesEntry[] }) {
  const [items, setItems] = useState(notes);
  const [active, setActive] = useState<AllNotesEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AllNotesEntry | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const courseOptions = useMemo(
    () =>
      Array.from(new Set(items.map((n) => n.courseTitle)))
        .sort()
        .map((c) => ({ label: c, value: c })),
    [items],
  );

  const stats = useMemo(
    () => [
      { label: "Total Notes", value: String(items.length), icon: NotebookPen, color: "text-slate-800 dark:text-slate-100" },
      { label: "Recorded", value: String(items.filter((n) => n.source === "recorded").length), icon: FileText, color: "text-sky-600 dark:text-sky-400" },
      { label: "Live", value: String(items.filter((n) => n.source === "live").length), icon: Radio, color: "text-brand-600 dark:text-brand-400" },
      { label: "Courses", value: String(new Set(items.map((n) => n.courseTitle)).size), icon: BookOpen, color: "text-green-600 dark:text-green-400" },
    ],
    [items],
  );

  function openView(note: AllNotesEntry) {
    setActive(note);
    setEditing(false);
    setEditContent(note.content);
  }

  function startEdit(e: React.MouseEvent, note: AllNotesEntry) {
    e.stopPropagation();
    setActive(note);
    setEditing(true);
    setEditContent(note.content);
  }

  async function handleSaveEdit() {
    if (!active) return;
    const content = editContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      await updateNote(active, content);
      setItems((prev) => prev.map((n) => (n.id === active.id && n.source === active.source ? { ...n, content } : n)));
      setActive((prev) => (prev ? { ...prev, content } : prev));
      setEditing(false);
      toast.success("Note updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(e: React.MouseEvent, note: AllNotesEntry) {
    e.stopPropagation();
    setDeleteTarget(note);
  }

  async function handleDelete() {
    const note = deleteTarget;
    if (!note) return;
    setDeletingId(note.id);
    try {
      await removeNote(note);
      setItems((prev) => prev.filter((n) => !(n.id === note.id && n.source === note.source)));
      if (active?.id === note.id && active.source === note.source) setActive(null);
      setDeleteTarget(null);
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<AllNotesEntry>[] = [
    {
      key: "lessonTitle",
      header: "Course · Lesson",
      render: (note) => (
        <div className="max-w-[220px]">
          <div className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{note.courseTitle}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <span className="truncate">{note.lessonTitle}</span>
            {note.source === "live" && <LiveBadge />}
          </div>
        </div>
      ),
    },
    {
      key: "content",
      header: "Note",
      render: (note) => (
        <p className="line-clamp-2 max-w-md whitespace-normal text-gray-600 dark:text-slate-300">{note.content}</p>
      ),
    },
    {
      key: "createdAt",
      header: "Saved",
      sortable: true,
      render: (note) => (
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {mounted ? relativeTime(note.createdAt) : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (note) => (
        <div
          data-note-id={note.id}
          data-lesson-id={note.lessonId}
          data-note-source={note.source}
          className="flex items-center justify-end gap-1"
        >
          <button
            type="button"
            data-action="edit-note"
            aria-label="Edit note"
            onClick={(e) => startEdit(e, note)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-action="delete-note"
            aria-label="Delete note"
            disabled={deletingId === note.id}
            onClick={(e) => confirmDelete(e, note)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            {deletingId === note.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchable
        searchKeys={["content", "lessonTitle", "courseTitle"]}
        searchPlaceholder="Search notes or lessons…"
        emptyMessage="No notes match your filters."
        onRowClick={openView}
        pageSize={8}
        filters={[
          { key: "courseTitle", label: "Course", options: courseOptions },
          {
            key: "source",
            label: "Type",
            options: [
              { label: "Recorded", value: "recorded" },
              { label: "Live", value: "live" },
            ],
          },
        ]}
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-sm">
                    <NotebookPen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 pt-0.5 text-left">
                    <DialogTitle className="text-gray-900 dark:text-slate-100">{active.lessonTitle}</DialogTitle>
                    <DialogDescription asChild>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <span>{active.courseTitle}</span>
                        {active.source === "live" && <LiveBadge />}
                        <span className="ml-auto">{mounted ? relativeTime(active.createdAt) : ""}</span>
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {editing ? (
                <div className="space-y-3">
                  <textarea
                    data-testid="note-edit-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={7}
                    autoFocus
                    className="w-full min-h-[140px] resize-y rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:ring-brand-500/20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-200 dark:[&::-webkit-scrollbar-thumb]:bg-brand-500/30 [&::-webkit-scrollbar-track]:bg-transparent"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      data-action="save-note"
                      onClick={handleSaveEdit}
                      disabled={saving || !editContent.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
                    >
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 max-h-64 overflow-y-auto rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-200 dark:[&::-webkit-scrollbar-thumb]:bg-brand-500/30 [&::-webkit-scrollbar-track]:bg-transparent">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                      {active.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={active.courseHref}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
                    >
                      Go to lesson
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      data-action="edit-note"
                      onClick={(e) => startEdit(e, active)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm border-gray-200 bg-white text-center dark:border-slate-800 dark:bg-slate-900">
          {deleteTarget && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center text-gray-900 dark:text-slate-100">Delete this note?</DialogTitle>
                <DialogDescription className="text-center text-gray-500 dark:text-slate-400">
                  This will permanently remove your note on{" "}
                  <span className="font-medium text-gray-700 dark:text-slate-300">{deleteTarget.lessonTitle}</span>.
                  This action can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-action="confirm-delete-note"
                  onClick={handleDelete}
                  disabled={deletingId === deleteTarget.id}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  {deletingId === deleteTarget.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
