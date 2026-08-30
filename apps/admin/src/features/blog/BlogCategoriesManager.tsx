"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { BlogCategory } from "./api";

interface Props { initial: BlogCategory[] }

export function BlogCategoriesManager({ initial }: Props) {
  const [categories, setCategories] = useState<BlogCategory[]>(initial);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
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
      const res = await apiRequestBrowser<BlogCategory>("/blog/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }).catch(() => null);
      if (!res) { toast.error("Failed to create"); return; }
      setCategories((p) => [...p, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setAdding(false);
      toast.success("Category created");
    });
  }

  function saveEdit(id: number) {
    const name = editName.trim();
    if (!name) { toast.error("Name is required"); return; }
    startTransition(async () => {
      const res = await apiRequestBrowser<BlogCategory>(`/blog/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }).catch(() => null);
      if (!res) { toast.error("Failed to update"); return; }
      setCategories((p) => p.map((c) => c.id === id ? res.data : c));
      setEditingId(null);
      toast.success("Category updated");
    });
  }

  function remove(cat: BlogCategory) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await apiRequestBrowser(`/blog/categories/${cat.id}`, { method: "DELETE" }).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      setCategories((p) => p.filter((c) => c.id !== cat.id));
      toast.success("Category deleted");
    });
  }

  return (
    <div className="p-6 max-w-2xl">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        message={deleteTarget ? <>Delete category <strong>"{deleteTarget.name}"</strong>? Posts in this category will become uncategorized.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Categories</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage categories for blog posts.</p>
        </div>
        <button
          onClick={() => { setAdding(true); setNewName(""); }}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Category
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
            placeholder="Category name"
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
        {categories.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No categories yet. Click "New Category" to create one.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 rounded-lg border border-brand-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button onClick={() => saveEdit(cat.id)} disabled={isPending} className="text-green-600 hover:text-green-700">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.slug}</p>
                    </div>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
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
