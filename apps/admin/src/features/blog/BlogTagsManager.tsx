"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { BlogTag } from "./api";

interface Props { initial: BlogTag[] }

export function BlogTagsManager({ initial }: Props) {
  const [tags, setTags] = useState<BlogTag[]>(initial);
  const [deleteTarget, setDeleteTarget] = useState<BlogTag | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add form
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  function add() {
    const name = newName.trim();
    if (!name) { toast.error("Name is required"); return; }
    startTransition(async () => {
      const res = await apiRequestBrowser<BlogTag>("/blog/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      }).catch(() => null);
      if (!res) { toast.error("Failed to create"); return; }
      setTags((p) => [...p, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setAdding(false);
      toast.success("Tag created");
    });
  }

  function saveEdit(id: number) {
    const name = editName.trim();
    if (!name) { toast.error("Name is required"); return; }
    startTransition(async () => {
      const res = await apiRequestBrowser<BlogTag>(`/blog/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }).catch(() => null);
      if (!res) { toast.error("Failed to update"); return; }
      setTags((p) => p.map((t) => t.id === id ? res.data : t));
      setEditingId(null);
      toast.success("Tag updated");
    });
  }

  function remove(tag: BlogTag) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await apiRequestBrowser(`/blog/tags/${tag.id}`, { method: "DELETE" }).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      setTags((p) => p.filter((t) => t.id !== tag.id));
      toast.success("Tag deleted");
    });
  }

  return (
    <div className="p-6 max-w-2xl">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Tag"
        message={deleteTarget ? <>Delete tag <strong>"{deleteTarget.name}"</strong>? It will be removed from all posts.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Tags</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage tags for blog posts.</p>
        </div>
        <button
          onClick={() => { setAdding(true); setNewName(""); }}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Tag
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Tag name"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button onClick={add} disabled={isPending} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        {tags.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No tags yet. Click &quot;New Tag&quot; to create one.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-3 px-5 py-3.5">
                {editingId === tag.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(tag.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 rounded-lg border border-brand-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button onClick={() => saveEdit(tag.id)} disabled={isPending} className="text-green-600 hover:text-green-700">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                      <p className="text-xs text-gray-400">{tag.slug}</p>
                    </div>
                    <button
                      onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tag)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
