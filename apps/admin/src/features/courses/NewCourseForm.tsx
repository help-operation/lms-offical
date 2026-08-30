"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { createCourseAction } from "@/features/courses/actions/courses.actions";
import { createCategoryAction } from "@/features/admin/actions/admin.actions";
import type { Category } from "@/features/courses/api";
import { toast } from "@repo/ui/sonner";

interface NewCourseFormProps {
  categories: Category[];
  onSuccess?: (courseId: number) => void;
}

// ─── Create Category Mini-Modal ───────────────────────────────────────────────

interface CreateCategoryModalProps {
  onClose: () => void;
  onCreated: (cat: Category) => void;
}

function CreateCategoryModal({ onClose, onCreated }: CreateCategoryModalProps) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createCategoryAction({ name: name.trim(), description: description.trim() || undefined });
      if (res.success && res.data) {
        toast.success("Category created");
        onCreated({ id: res.data.id, name: res.data.name, slug: res.data.slug });
      } else {
        setError((res as any).message ?? "Failed to create category");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop (sits above the course modal's z-50) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Plus className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">New Category</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add a new course category to the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:opacity-60"
              placeholder="e.g. Web Development"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none disabled:opacity-60"
              placeholder="Brief description of this category"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {isPending ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── New Course Form ──────────────────────────────────────────────────────────

export function NewCourseForm({ categories: initialCategories, onSuccess }: NewCourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition]   = useTransition();
  const [error, setError]              = useState<string | null>(null);
  const [categories, setCategories]    = useState<Category[]>(initialCategories);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await createCourseAction(formData);
      if (!res.success) {
        setError(res.message);
        toast.error(res.message ?? "Failed to create course");
        return;
      }
      toast.success("Course created");
      if (onSuccess) {
        onSuccess(res.data.id);
      } else {
        router.push("/admin/courses");
      }
    });
  }

  function handleCategoryCreated(cat: Category) {
    setCategories((prev) => [...prev, cat]);
    setCategoryModalOpen(false);
  }

  return (
    <>
      {categoryModalOpen && (
        <CreateCategoryModal
          onClose={() => setCategoryModalOpen(false)}
          onCreated={handleCategoryCreated}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <Field label="Course Title *">
          <input
            name="title"
            required
            disabled={isPending}
            className="input-base"
            placeholder="e.g. Complete Python Bootcamp"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            rows={3}
            disabled={isPending}
            className="input-base resize-none"
            placeholder="Brief description of what students will learn"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category with inline + button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                disabled={isPending}
                title="Add new category"
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>
            <select name="categoryId" disabled={isPending} className="input-base">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Field label="Level *">
            <select name="level" required disabled={isPending} className="input-base" defaultValue="">
              <option value="" disabled>Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="beginner_to_advanced">Beginner to Advanced</option>
            </select>
          </Field>

          <Field label="Language">
            <select name="language" disabled={isPending} className="input-base" defaultValue="">
              <option value="" disabled>Select language</option>
              <option value="Bangla">Bangla</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </Field>

          <Field label="Price (৳)">
            <input
              name="price"
              type="number"
              min="0"
              defaultValue="0"
              disabled={isPending}
              className="input-base"
              placeholder="0 for free"
            />
          </Field>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {isPending ? "Creating…" : "Create Course"}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
