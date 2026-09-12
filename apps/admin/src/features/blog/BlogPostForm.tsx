"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Loader2, Plus, X, Search, Calendar } from "lucide-react";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { createBlogPostAction, updateBlogPostAction } from "@/features/blog/actions/blog.actions";
import type { BlogPost, BlogCategory, BlogTag, BlogAuthor } from "@/features/blog/api";
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toast.error(msg);
    } finally {
      setCategoryPending(false);
    }
  }

  async function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;
    setTagPending(true);
    try {
      const res = await apiRequestBrowser<BlogTag>("/blog/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const newTag = res.data;
      setAllTags((p) => [...p, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTagIds((p) => [...p, newTag.id]);
      setAddingTag(false);
      setNewTagName("");
      toast.success(`Tag "${name}" created`);
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setTagPending(false);
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

  // ── Tags state ───────────────────────────────────────────────────────────────
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    post?.tags?.map((t) => t.id) ?? []
  );
  const [tagSearch, setTagSearch] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagPending, setTagPending] = useState(false);

  // ── SEO state ────────────────────────────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [ogImage, setOgImage] = useState(post?.ogImage ?? "");

  // ── Featured state ──────────────────────────────────────────────────────────
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);

  // ── Author state ───────────────────────────────────────────────────────────
  const [allAuthors, setAllAuthors] = useState<BlogAuthor[]>([]);
  const [authorId, setAuthorId] = useState<number | "">(post?.authorId ?? "");
  const [authorSearch, setAuthorSearch] = useState("");

  // ── Schedule state ─────────────────────────────────────────────────────────
  const [scheduleAt, setScheduleAt] = useState(post?.publishAt ? post.publishAt.slice(0, 16) : "" );

  // Fetch available tags + authors on mount
  useEffect(() => {
    apiRequestBrowser<BlogTag[]>("/blog/tags")
      .then((res) => setAllTags(res.data ?? []))
      .catch(() => {});
    apiRequestBrowser<BlogAuthor[]>("/blog/admin/authors")
      .then((res) => setAllAuthors(res.data ?? []))
      .catch(() => {});
  }, []);

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
      scheduleAt: (!publish && scheduleAt) ? scheduleAt : undefined,
      tags:       selectedTagIds,
      metaTitle:       metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      ogImage:         ogImage.trim() || undefined,
      isFeatured,
      authorId:   authorId !== "" ? Number(authorId) : undefined,
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
  const isScheduled = post?.status === "scheduled";

  return (
    <div className="flex flex-col h-full overflow-hidden">

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

          {/* Save as draft / Unpublish / Cancel Schedule */}
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isPending && saving === "draft"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            {isPublished ? "Unpublish" : isScheduled ? "Cancel Schedule" : "Save Draft"}
          </button>

          {/* Publish — show when not currently published */}
          {!isPublished && (
            <button
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isPending && saving === "publish"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Globe className="h-3.5 w-3.5" />}
              {isScheduled ? "Publish Now" : "Publish"}
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
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">

          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPublished ? "bg-green-500" : isScheduled ? "bg-yellow-500" : "bg-gray-400"}`} />
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

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tags
            </label>
            {/* Selected tags */}
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags
                  .filter((t) => selectedTagIds.includes(t.id))
                  .map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => setSelectedTagIds((p) => p.filter((id) => id !== tag.id))}
                        className="text-brand-400 hover:text-brand-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
            {/* Tag search / select */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Search tags…"
                className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {tagSearch && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {allTags
                  .filter(
                    (t) =>
                      t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                      !selectedTagIds.includes(t.id),
                  )
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagIds((p) => [...p, tag.id]);
                        setTagSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {tag.name}
                    </button>
                  ))}
                {allTags.filter(
                  (t) =>
                    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                    !selectedTagIds.includes(t.id),
                ).length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewTagName(tagSearch);
                      setAddingTag(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    + Create &ldquo;{tagSearch}&rdquo;
                  </button>
                )}
              </div>
            )}
            {/* Inline new tag form */}
            {addingTag && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  autoFocus
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
                    if (e.key === "Escape") setAddingTag(false);
                  }}
                  placeholder="Tag name"
                  className="flex-1 rounded-xl border border-brand-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={tagPending}
                  className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {tagPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingTag(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Featured */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  isFeatured ? "bg-brand-500" : "bg-gray-300"
                }`}
                onClick={() => setIsFeatured(!isFeatured)}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    isFeatured ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Featured Post
                </span>
                <p className="text-xs text-gray-400">Shown prominently on the blog listing</p>
              </div>
            </label>
          </div>

          {/* Author */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Author
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                placeholder={
                  authorId !== ""
                    ? allAuthors.find((a) => a.id === authorId)
                        ? `${allAuthors.find((a) => a.id === authorId)!.firstName} ${allAuthors.find((a) => a.id === authorId)!.lastName}`
                        : "Search authors…"
                    : "Search authors…"
                }
                className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {authorId !== "" && (
              <button
                type="button"
                onClick={() => { setAuthorId(""); setAuthorSearch(""); }}
                className="text-xs text-brand-500 hover:text-brand-700"
              >
                Clear author
              </button>
            )}
            {authorSearch && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {allAuthors
                  .filter(
                    (a) =>
                      `${a.firstName} ${a.lastName}`.toLowerCase().includes(authorSearch.toLowerCase()) ||
                      a.email.toLowerCase().includes(authorSearch.toLowerCase()),
                  )
                  .slice(0, 10)
                  .map((author) => (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => {
                        setAuthorId(author.id);
                        setAuthorSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{author.firstName} {author.lastName}</span>
                      <span className="ml-2 text-xs text-gray-400">{author.email}</span>
                    </button>
                  ))}
                {allAuthors.filter(
                  (a) =>
                    `${a.firstName} ${a.lastName}`.toLowerCase().includes(authorSearch.toLowerCase()) ||
                    a.email.toLowerCase().includes(authorSearch.toLowerCase()),
                ).length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">No authors found</p>
                )}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </label>
            <p className="text-xs text-gray-400">
              Leave blank to publish immediately when you click Publish.
            </p>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {scheduleAt && (
              <button
                type="button"
                onClick={() => setScheduleAt("")}
                className="text-xs text-brand-500 hover:text-brand-700"
              >
                Clear schedule (publish immediately)
              </button>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SEO</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || "SEO title…"}
                maxLength={60}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">{metaTitle.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={excerpt || "SEO description…"}
                maxLength={160}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">{metaDescription.length}/160 characters</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">OG Image</label>
              <ImagePickerField
                value={ogImage}
                onChange={setOgImage}
                previewClassName="w-full h-20 object-cover rounded-xl border border-gray-100 mt-1"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
