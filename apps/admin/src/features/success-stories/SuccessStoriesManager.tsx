"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Eye, EyeOff, Play } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { successStoriesApiBrowser } from "./api/browser";
import type { SuccessStory } from "./types";

interface Props { initial: SuccessStory[]; existingCategories: string[] }

const EMPTY_FORM = { name: "", batch: "", category: "", image: "", videoUrl: "" };

function getYouTubeThumbnail(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}

const NEW_CATEGORY = "__new__";

export function SuccessStoriesManager({ initial, existingCategories }: Props) {
  const [stories, setStories] = useState<SuccessStory[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuccessStory | null>(null);

  // Keep categories list up to date as new stories are added
  const allCategories = Array.from(
    new Set([...existingCategories, ...stories.map((s) => s.category)].filter(Boolean))
  );

  function setField(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsNewCategory(false);
    setFormOpen(true);
  }

  function openEdit(s: SuccessStory) {
    setEditing(s);
    setForm({
      name:     s.name,
      batch:    s.batch,
      category: s.category,
      image:    s.image,
      videoUrl: s.videoUrl ?? "",
    });
    setIsNewCategory(!allCategories.includes(s.category));
    setFormOpen(true);
  }

  function save() {
    if (!form.name.trim())     { toast.error("Name is required"); return; }
    if (!form.batch.trim())    { toast.error("Batch is required"); return; }
    if (!form.category.trim()) { toast.error("Category is required"); return; }

    const payload = {
      name:     form.name.trim(),
      batch:    form.batch.trim(),
      category: form.category.trim(),
      image:    form.image.trim(),
      videoUrl: form.videoUrl.trim() || null,
    };

    startTransition(async () => {
      if (editing) {
        const res = await successStoriesApiBrowser.update(editing.id, payload).catch(() => null);
        if (!res) { toast.error("Failed to save"); return; }
        setStories((p) => p.map((s) => (s.id === editing.id ? res.data : s)));
        toast.success("Story updated");
      } else {
        const res = await successStoriesApiBrowser.create(payload).catch(() => null);
        if (!res) { toast.error("Failed to create"); return; }
        setStories((p) => [...p, res.data]);
        toast.success("Story added");
      }
      setFormOpen(false);
    });
  }

  function toggle(story: SuccessStory) {
    startTransition(async () => {
      const res = await successStoriesApiBrowser.toggle(story.id).catch(() => null);
      if (!res) { toast.error("Failed to update"); return; }
      setStories((p) => p.map((s) => (s.id === story.id ? res.data : s)));
    });
  }

  function remove(story: SuccessStory) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await successStoriesApiBrowser.delete(story.id).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      setStories((p) => p.filter((s) => s.id !== story.id));
      toast.success("Story deleted");
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= stories.length) return;
    const next = [...stories];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const prev = stories;
    setStories(next);
    startTransition(async () => {
      const res = await successStoriesApiBrowser
        .reorder(next.map((s, i) => ({ id: s.id, order: i })))
        .catch(() => null);
      if (!res) { setStories(prev); toast.error("Failed to reorder"); }
    });
  }

  return (
    <div className="p-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Story"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.name}</strong>'s success story? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Success Stories</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage student success stories shown on the landing page.
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Story
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        {stories.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No stories yet. Click "Add Story" to create one.
          </p>
        )}
        <ul className="divide-y divide-gray-50">
          {stories.map((story, i) => (
            <li
              key={story.id}
              className={`flex items-center gap-3 px-5 py-3.5 ${story.isActive ? "" : "opacity-50"}`}
            >
              {/* Reorder */}
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0 || isPending} className="text-gray-300 hover:text-brand-600 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === stories.length - 1 || isPending} className="text-gray-300 hover:text-brand-600 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>

              {/* Thumbnail */}
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                {(story.image || story.videoUrl) ? (
                  <img
                    src={story.image || getYouTubeThumbnail(story.videoUrl ?? "")}
                    alt={story.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Play className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{story.name}</span>
                  {!story.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Hidden</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">Batch: {story.batch}</span>
                  <span className="text-xs text-brand-500 font-medium">{story.category}</span>
                  {story.videoUrl && <span className="text-xs text-green-600">Has video</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(story)} disabled={isPending} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700" title={story.isActive ? "Hide" : "Show"}>
                  {story.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(story)} disabled={isPending} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(story)} disabled={isPending} className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">
                {editing ? "Edit Story" : "Add Story"}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Sahed Mohammad" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              {/* Batch */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Batch</label>
                <input value={form.batch} onChange={(e) => setField("batch", e.target.value)} placeholder="e.g. CCC 2505" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                {!isNewCategory ? (
                  <select
                    value={form.category}
                    onChange={(e) => {
                      if (e.target.value === NEW_CATEGORY) {
                        setIsNewCategory(true);
                        setField("category", "");
                      } else {
                        setField("category", e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                  >
                    <option value="">-- Select category --</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value={NEW_CATEGORY}>+ Add new category...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      placeholder="e.g. freelancing"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsNewCategory(false); setField("category", ""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400">Used for filter tabs on the frontend.</p>
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Thumbnail Image</label>
                <ImagePickerField
                  value={form.image}
                  onChange={(v) => setField("image", v)}
                  previewClassName="w-full h-28 object-cover rounded-xl border border-gray-100 mt-1"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Video URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.videoUrl} onChange={(e) => setField("videoUrl", e.target.value)} placeholder="https://youtube.com/..." className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3.5">
              <button onClick={() => setFormOpen(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={save} disabled={isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {editing ? "Save Changes" : "Add Story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
