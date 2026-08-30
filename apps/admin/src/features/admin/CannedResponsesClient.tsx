"use client";

import { useState, useTransition } from "react";
import { PencilSimple, Trash, Plus, X, FloppyDisk } from "@phosphor-icons/react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { supportAdminApiBrowser } from "@/features/admin/api/support/browser";
import type { CannedResponse } from "@/features/admin/api/support";
import { toast } from "@repo/ui/sonner";

const CATEGORIES = ["general", "billing", "technical", "course_content", "certificate", "refund"];

interface FormState {
  title: string;
  body: string;
  category: string;
  sortOrder: number;
}

const EMPTY: FormState = { title: "", body: "", category: "general", sortOrder: 0 };

export function CannedResponsesClient({ initial }: { initial: CannedResponse[] }) {
  const [items, setItems]           = useState(initial);
  const [editing, setEditing]       = useState<number | null>(null);  // null = none, 0 = new
  const [form, setForm]             = useState<FormState>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<CannedResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setEditing(0);
    setForm(EMPTY);
  }

  function openEdit(item: CannedResponse) {
    setEditing(item.id);
    setForm({ title: item.title, body: item.body, category: item.category, sortOrder: item.sortOrder });
  }

  function cancel() {
    setEditing(null);
    setForm(EMPTY);
  }

  function save() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing === 0) {
          const res = await supportAdminApiBrowser.createCanned(form);
          setItems((prev) => [...prev, res.data]);
          toast.success("Template created");
        } else if (editing) {
          const res = await supportAdminApiBrowser.updateCanned(editing, form);
          setItems((prev) => prev.map((i) => i.id === editing ? res.data : i));
          toast.success("Template updated");
        }
        cancel();
      } catch {
        toast.error("Failed to save template");
      }
    });
  }

  function remove(item: CannedResponse) {
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await supportAdminApiBrowser.deleteCanned(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success("Template deleted");
      } catch {
        toast.error("Failed to delete template");
      }
    });
  }

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Template"
        message={deleteTarget ? <>Delete template <strong>"{deleteTarget.title}"</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Add button */}
      {editing === null && (
        <div className="flex justify-end">
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>
      )}

      {/* Form (new or edit) */}
      {editing !== null && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-4">
          <p className="font-semibold text-brand-800">{editing === 0 ? "New Template" : "Edit Template"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Acknowledge Receipt"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Body *</label>
            <textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write the response template here…"
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <FloppyDisk className="h-4 w-4" />
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancel}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {items.length === 0 && editing === null && (
        <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center">
          <p className="text-sm text-gray-400">No templates yet.</p>
          <button onClick={openNew} className="mt-3 text-sm text-brand-600 hover:underline">
            Create your first template
          </button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              editing === item.id ? "border-brand-300" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 capitalize">
                    {item.category.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 whitespace-pre-wrap">{item.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(item)}
                  disabled={editing !== null}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
                >
                  <PencilSimple className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  disabled={isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
