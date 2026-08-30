"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Globe, FileEdit, Pencil, Heart, MessageSquare, Share2 } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  fetchBlogPostsAction,
  updateBlogPostAction,
  deleteBlogPostAction,
} from "@/features/blog/actions/blog.actions";
import type { BlogPost } from "@/features/blog/api";
import type { PaginatedResponse, TableQueryParams } from "@/features/admin/api";
import { DataTable, type Column, type TablePagination } from "@repo/ui/data-table";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialData: PaginatedResponse<BlogPost> }

function buildAllCols(formatDate: (v: string | null | undefined) => string): ColDef<BlogPost>[] {
  return [
    {
      key: "title", header: "Title", defaultVisible: true,
      exportFields: [
        { header: "Title", getValue: (p) => p.title },
        { header: "Slug", getValue: (p) => p.slug },
      ],
    },
    {
      key: "authorFirstName", header: "Author", defaultVisible: true,
      exportFields: [{ header: "Author", getValue: (p) => `${p.authorFirstName} ${p.authorLastName}` }],
    },
    {
      key: "status", header: "Status", defaultVisible: true,
      exportFields: [{ header: "Status", getValue: (p) => p.status }],
    },
    {
      key: "createdAt", header: "Date", defaultVisible: true,
      exportFields: [{
        header: "Date",
        getValue: (p) => p.publishedAt
          ? formatDate(p.publishedAt)
          : p.createdAt ? formatDate(p.createdAt) : "",
      }],
    },
    {
      key: "likeCount", header: "Engagement", defaultVisible: true,
      exportFields: [
        { header: "Likes",    getValue: (p) => String((p as any).likeCount ?? 0)    },
        { header: "Comments", getValue: (p) => String((p as any).commentCount ?? 0) },
      ],
    },
  ];
}

const DEFAULT_VISIBLE = new Set(buildAllCols((v) => v ?? "").map((c) => c.key));

export function BlogPostsClient({ initialData }: Props) {
  const router = useRouter();
  const { formatDate } = useLocalization();
  const ALL_COLS = buildAllCols(formatDate);
  const [posts, setPosts]             = useState(initialData.data);
  const [pagination, setPagination]   = useState<TablePagination>(initialData.pagination);
  const [isLoading, setIsLoading]     = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [toggleTarget, setToggleTarget] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);

  async function fetchPosts(params: TableQueryParams) {
    setIsLoading(true);
    try {
      const res = await fetchBlogPostsAction(params);
      if (res.success && res.data) {
        setPosts(res.data.data);
        setPagination(res.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleTogglePublish(post: BlogPost) {
    setToggleTarget(null);
    startTransition(async () => {
      const res = await updateBlogPostAction(post.id, { publish: post.status !== "published" });
      if (res.success) {
        setPosts((prev) => prev.map((p) => p.id === post.id ? res.data : p));
        toast.success(post.status !== "published" ? "Post published" : "Post unpublished");
      } else {
        toast.error("Failed to update post");
      }
    });
  }

  function handleDelete(post: BlogPost) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteBlogPostAction(post.id, post.slug);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast.success("Post deleted");
      } else {
        toast.error("Failed to delete post");
      }
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<BlogPost[]> {
    const res = await fetchBlogPostsAction({ page: 1, per_page: 100000 });
    return res.success && res.data ? res.data.data : [];
  }

  const visibleColumns: Column<BlogPost>[] = [
    ...(visibleCols.has("title") ? [{
      key: "title" as const, header: "Title", sortable: true,
      render: (post: BlogPost) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">{post.slug}</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("authorFirstName") ? [{
      key: "authorFirstName" as const, header: "Author",
      render: (post: BlogPost) => (
        <span className="text-sm text-gray-500 dark:text-slate-400">{post.authorFirstName} {post.authorLastName}</span>
      ),
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (post: BlogPost) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${post.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400"}`}>
          {post.status}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("createdAt") ? [{
      key: "createdAt" as const, header: "Date", sortable: true,
      render: (post: BlogPost) => (
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {post.publishedAt
            ? formatDate(post.publishedAt)
            : post.createdAt ? formatDate(post.createdAt) : "—"}
        </span>
      ),
    }] : []),
    ...(visibleCols.has("likeCount") ? [{
      key: "likeCount" as keyof BlogPost, header: "Engagement",
      render: (post: BlogPost & { likeCount?: number; commentCount?: number; shareCount?: number }) => (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1" title="Likes">
            <Heart className="h-3.5 w-3.5 text-red-400" />
            {post.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1" title="Comments">
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
            {post.commentCount ?? 0}
          </span>
          <span className="flex items-center gap-1" title="Shares">
            <Share2 className="h-3.5 w-3.5 text-green-400" />
            {post.shareCount ?? 0}
          </span>
        </div>
      ),
    }] : []),
    {
      key: "id" as const, header: "Actions",
      render: (post: BlogPost) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
            title="Edit post"
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setToggleTarget(post)}
            disabled={isPending}
            title={post.status === "published" ? "Unpublish" : "Publish"}
            className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand transition-colors disabled:opacity-50"
          >
            {post.status === "published"
              ? <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
              : <FileEdit className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setDeleteTarget(post)}
            disabled={isPending}
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Publish/unpublish modal */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.status === "published" ? "Unpublish Post" : "Publish Post"}
        message={
          toggleTarget?.status === "published"
            ? <>Unpublish <strong>{toggleTarget.title}</strong>? It will no longer be visible to readers.</>
            : <>Publish <strong>{toggleTarget?.title}</strong>? It will become visible to all readers.</>
        }
        confirmLabel={toggleTarget?.status === "published" ? "Yes, Unpublish" : "Yes, Publish"}
        variant={toggleTarget?.status === "published" ? "warning" : "success"}
        icon={toggleTarget?.status === "published" ? <FileEdit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />}
        isPending={isPending}
        onConfirm={() => toggleTarget && handleTogglePublish(toggleTarget)}
        onClose={() => setToggleTarget(null)}
      />

      {/* Delete post modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Post"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Write and manage blog posts for the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={posts}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`blog-posts-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Blog Posts Export"
          />
          <button
            onClick={() => router.push("/admin/blog/new")}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand dark:hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm dark:shadow-none"
          >
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Blog Posts</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={posts}
        columns={visibleColumns}
        serverSide
        pagination={pagination}
        onQueryChange={fetchPosts}
        dateRangeKey="createdAt"
        portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search posts…"
        filters={[
          {
            key: "status",
            label: "All Status",
            options: [
              { label: "Draft",     value: "draft"     },
              { label: "Published", value: "published" },
            ],
          },
        ]}
        emptyMessage="No blog posts yet. Click &quot;New Post&quot; to create one."
      />
        </div>
      </div>
    </>
  );
}
