"use client";

import { useState, useTransition } from "react";
import { Trash2, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { DataTable, type Column } from "@repo/ui/data-table";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";

export type BlogComment = {
  id: number;
  postId: number;
  postTitle: string;
  postSlug: string;
  parentId: number | null;
  content: string;
  createdAt: string | null;
  userId: number;
  userFirstName: string | null;
  userLastName: string | null;
  userAvatar: string | null;
};

interface Props { initial: BlogComment[] }

function userName(c: BlogComment) {
  return `${c.userFirstName ?? ""} ${c.userLastName ?? ""}`.trim() || "Anonymous";
}

function initials(c: BlogComment) {
  const f = c.userFirstName?.[0] ?? "";
  const l = c.userLastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<BlogComment>[] = [
  {
    key: "author", header: "Author", defaultVisible: true,
    exportFields: [{ header: "Author", getValue: (c) => userName(c) }],
  },
  {
    key: "comment", header: "Comment", defaultVisible: true,
    exportFields: [
      { header: "Comment",  getValue: (c) => c.content },
      { header: "Reply?",   getValue: (c) => c.parentId ? "Yes" : "No" },
    ],
  },
  {
    key: "post", header: "Post", defaultVisible: true,
    exportFields: [{ header: "Post", getValue: (c) => c.postTitle }],
  },
  {
    key: "date", header: "Date", defaultVisible: true,
    exportFields: [{ header: "Date", getValue: (c) => formatDate(c.createdAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function BlogCommentsManager({ initial }: Props) {
  const [comments,     setComments]     = useState<BlogComment[]>(initial);
  const [search,       setSearch]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogComment | null>(null);
  const [isPending,    startTransition] = useTransition();
  const [visibleCols, setVisibleCols]   = useState<Set<string>>(DEFAULT_VISIBLE);

  const filtered = search.trim()
    ? comments.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.content.toLowerCase().includes(q) ||
          `${c.userFirstName} ${c.userLastName}`.toLowerCase().includes(q) ||
          c.postTitle.toLowerCase().includes(q)
        );
      })
    : comments;

  function remove(comment: BlogComment) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await apiRequestBrowser(`/blog/admin/comments/${comment.id}`, { method: "DELETE" }).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      setComments((p) => p.filter((c) => c.id !== comment.id));
      toast.success("Comment deleted");
    });
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  const visibleColumns: Column<BlogComment>[] = [
    ...(visibleCols.has("author") ? [{
      key: "author" as const, header: "Author",
      render: (c: BlogComment) => (
        <div className="flex items-center gap-2.5">
          {c.userAvatar ? (
            <img src={c.userAvatar} alt={userName(c)} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand/15 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand">
              {initials(c)}
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{userName(c)}</span>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("comment") ? [{
      key: "comment" as const, header: "Comment", className: "max-w-xs",
      render: (c: BlogComment) => (
        <div>
          {c.parentId && (
            <span className="inline-block mb-1 text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded px-1.5 py-0.5">↩ Reply</span>
          )}
          <p className="text-gray-700 dark:text-slate-300 line-clamp-2">{c.content}</p>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("post") ? [{
      key: "post" as const, header: "Post",
      render: (c: BlogComment) => (
        <div className="flex items-center gap-1.5">
          <span className="text-gray-700 dark:text-slate-300 truncate max-w-[160px]">{c.postTitle}</span>
          <a href={`${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"}/blog/${c.postSlug}`}
            target="_blank" rel="noreferrer" className="text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand shrink-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    }] : []),
    ...(visibleCols.has("date") ? [{
      key: "date" as const, header: "Date",
      render: (c: BlogComment) => <span className="text-gray-400 dark:text-slate-500 whitespace-nowrap">{formatDate(c.createdAt)}</span>,
    }] : []),
    {
      key: "actions", header: "",
      render: (c: BlogComment) => (
        <button onClick={() => setDeleteTarget(c)} disabled={isPending}
          className="rounded-lg p-1.5 text-gray-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete comment">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Comment"
        message={deleteTarget ? <>Delete this comment by <strong>{userName(deleteTarget)}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Blog Comments</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
            {comments.length} total comment{comments.length !== 1 ? "s" : ""} across all posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={filtered}
            fields={exportFields}
            filename={`blog-comments-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Blog Comments Export"
          />
        </div>
      </div>

      {/* Table — client-side search via DataTable's built-in searchable */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Comments</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={filtered}
        columns={visibleColumns}
        searchable
        searchPlaceholder="Search comments…"
        onQueryChange={(params) => setSearch((params.search as string | undefined) ?? "")}
        emptyMessage={search ? "No comments match your search." : "No comments yet."}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
      />
        </div>
      </div>
    </div>
  );
}
