"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Loader2, Plus, X } from "lucide-react";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { createBlogPostAction, updateBlogPostAction } from "@/features/blog/actions/blog.actions";
import type { BlogPost, BlogCategory } from "@/features/blog/api";
import { RichTextEditor } from "./RichTextEditor";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { toast } from "@repo/ui/sonner";

interface Props {
  mode: "create" | "edit";
  post?: BlogPost;
  categories: BlogCategory[];
}

const NEW_CAT = "__new__";

function toSlugPreview(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogPostForm({ mode, post, categories: initialCategories }: Props) {
  const router   = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [categories, setCategories] = useState(initialCategories);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryPending, setCategoryPending] = useState(false);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryPending(true);
    try {
      const res = await apiRequestBrowser<BlogCategory>("/blog/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const newCat = res.data;
      setCategories((p) => [...p, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(newCat.id);
      setAddingCategory(false);
      setNewCategoryName("");
      toast.success(`Category "${name}" created`);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setCategoryPending(false);
    }
  }
  const [saving, setSaving]   = useState<"draft" | "publish" | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title,      setTitle]      = useState(post?.title      ?? "");
  const [slug,       setSlug]       = useState(post?.slug       ?? "");
  const [excerpt,    setExcerpt]    = useState(post?.excerpt    ?? "");
  const [content,    setContent]    = useState(post?.content    ?? "");
  const [thumbnail,  setThumbnail]  = useState(post?.thumbnail  ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(post?.categoryId ?? "");
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from title (only if user hasn't manually edited it)
  useEffect(() => {
    if (!slugEdited && mode === "create") {
      setSlug(toSlugPreview(title));
    }
  }, [title, slugEdited, mode]);

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave(publish: boolean) {
    if (!title.trim()) { setError("Title is required"); return; }
    setError(null);
    setSaving(publish ? "publish" : "draft");

    const payload = {
      title:      title.trim(),
      slug:       slug.trim() || undefined,
      excerpt:    excerpt.trim() || undefined,
      content:    content || undefined,
      thumbnail:  thumbnail.trim() || undefined,
      categoryId: categoryId !== "" ? Number(categoryId) : undefined,
      publish,
    };

    startTransition(async () => {
      try {
        let res;
        if (mode === "create") {
          res = await createBlogPostAction(payload);
        } else {
          res = await updateBlogPostAction(post!.id, payload);
        }
        if (!res.success) throw new Error(res.message);
        toast.success(
          mode === "create"
            ? (publish ? "Post published" : "Draft created")
            : (publish ? "Post published" : "Post updated"),
        );
        router.push("/admin/blog");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save post";
        setError(msg);
        toast.error(msg);
      } finally {
        setSaving(null);
      }
    });
  }

  const isPublished = post?.status === "published";

  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={() => router.push("/admin/blog")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Blog Posts
        </button>

        <p className="text-sm font-medium text-gray-700">
          {mode === "create" ? "New Post" : `Editing: ${post?.title}`}
        </p>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}

          {/* Save as draft */}
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isPending && saving === "draft"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            {isPublished ? "Unpublish" : "Save Draft"}
          </button>

          {/* Publish */}
          {!isPublished && (
            <button
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isPending && saving === "publish"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Globe className="h-3.5 w-3.5" />}
              Publish
            </button>
          )}

          {/* Already published: save changes */}
          {isPublished && (
            <button
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isPending && saving === "publish"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-6 p-6">

        {/* Left — Title + Editor */}
        <div className="flex flex-1 flex-col min-h-0 gap-4">

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title…"
            className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent border-none outline-none focus:outline-none"
          />

          {/* Slug preview */}
          <p className="text-xs text-gray-400 -mt-2 font-mono truncate">
            /blog/<span className="text-brand-500">{slug || "auto-generated"}</span>
          </p>

          {/* Rich text editor */}
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your post…"
          />
        </div>

        {/* Right — Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {post?.status ?? "Draft"}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === NEW_CAT) {
                  setAddingCategory(true);
                  setNewCategoryName("");
                } else {
                  setCategoryId(e.target.value ? Number(e.target.value) : "");
                }
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value={NEW_CAT}>+ New Category…</option>
            </select>

            {/* Inline new category form */}
            {addingCategory && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); }
                    if (e.key === "Escape") setAddingCategory(false);
                  }}
                  placeholder="Category name"
                  className="flex-1 rounded-xl border border-brand-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={categoryPending}
                  className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {categoryPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCategory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Slug */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Slug
            </label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              placeholder="auto-generated"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {slugEdited && (
              <button
                type="button"
                onClick={() => { setSlug(toSlugPreview(title)); setSlugEdited(false); }}
                className="text-xs text-brand-500 hover:text-brand-700"
              >
                ↺ Reset from title
              </button>
            )}
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Excerpt
            </label>
            <textarea
              rows={4}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary shown in listings and SEO…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Thumbnail */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Thumbnail
            </label>
            <ImagePickerField
              value={thumbnail}
              onChange={setThumbnail}
              previewClassName="w-full h-28 object-cover rounded-xl border border-gray-100 mt-1"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
