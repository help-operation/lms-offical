"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  File,
  HardDrive,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { bulkDeleteMediaAction } from "@/features/media/actions/media.actions";
import { formatFileSize } from "@/features/media/types";
import { MediaPreview } from "./MediaPreview";
import { MediaListView } from "./MediaListView";
import { MediaUploadModal } from "./MediaUploadModal";
import { MediaEditDialog } from "./MediaEditDialog";
import type { MediaFile, MediaPagination, MediaSummary } from "@/features/media/types";

interface MediaGridClientProps {
  files: MediaFile[];
  pagination: MediaPagination;
  summary: MediaSummary;
  /** "grid" | "list" — driven by URL searchParam */
  view: string;
}

const SUMMARY_ITEMS = [
  {
    key: "total_files" as const,
    label: "Total Files",
    icon: File,
    color: "bg-indigo-100 text-indigo-600",
    isSize: false,
  },
  {
    key: "total_images" as const,
    label: "Images",
    icon: ImageIcon,
    color: "bg-pink-100 text-pink-600",
    isSize: false,
  },
  {
    key: "total_videos" as const,
    label: "Videos",
    icon: Film,
    color: "bg-purple-100 text-purple-600",
    isSize: false,
  },
  {
    key: "total_documents" as const,
    label: "Documents",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    isSize: false,
  },
  {
    key: "total_size" as const,
    label: "Storage Used",
    icon: HardDrive,
    color: "bg-emerald-100 text-emerald-600",
    isSize: true,
  },
];

export function MediaGridClient({
  files,
  pagination,
  summary,
  view,
}: MediaGridClientProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const [selectedIds,    setSelectedIds]    = useState<Set<number>>(new Set());
  const [editFile,       setEditFile]       = useState<MediaFile | null>(null);
  const [showUpload,     setShowUpload]     = useState(false);
  const [isBulkDeleting, startBulkDelete]  = useTransition();

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === files.length ? new Set() : new Set(files.map((f) => f.id)),
    );
  }, [files]);

  function pushPage(page: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(page));
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    startBulkDelete(async () => {
      const res = await bulkDeleteMediaAction(ids);
      if (res.success) {
        toast.success(`${ids.length} file${ids.length !== 1 ? "s" : ""} deleted`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(res.message ?? "Bulk delete failed");
      }
    });
  }

  const isListView  = view === "list";
  const allSelected = files.length > 0 && selectedIds.size === files.length;

  return (
    <div className="space-y-5">
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {SUMMARY_ITEMS.map(({ key, label, icon: Icon, color, isSize }) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {isSize
                    ? formatFileSize(summary.total_size)
                    : summary[key as Exclude<typeof key, "total_size">]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: select-all + count */}
        <div className="flex items-center gap-2.5">
          {files.length > 0 && (
            <input
              type="checkbox"
              className="rounded border-gray-300 cursor-pointer"
              checked={allSelected}
              onChange={toggleSelectAll}
              aria-label="Select all visible files"
            />
          )}
          {selectedIds.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isBulkDeleting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2  className="h-4 w-4" />
              }
              Delete {selectedIds.size}
            </button>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* ── Grid or List ──────────────────────────────────────────────────── */}
      {isListView ? (
        <MediaListView
          files={files}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          onOpen={setEditFile}
        />
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <File className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No files found.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map((file) => {
            const selected = selectedIds.has(file.id);
            return (
              <div
                key={file.id}
                onClick={() => setEditFile(file)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md ${
                  selected
                    ? "border-indigo-400 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Checkbox — click doesn't bubble to card */}
                <div
                  className="absolute left-2 top-2 z-10"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}}
                    className="cursor-pointer rounded border-white shadow"
                    aria-label={`Select ${file.filename}`}
                  />
                </div>

                {/* Preview thumbnail */}
                <div className="aspect-video overflow-hidden">
                  <MediaPreview file={file} className="h-full w-full" />
                </div>

                {/* File info */}
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-gray-700">
                    {file.filename}
                  </p>
                  <p className="text-[10px] text-gray-400">{file.formattedSize}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination.last_page > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing {pagination.from}–{pagination.to} of {pagination.total} files
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pushPage(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            {/* Render up to 7 page buttons */}
            {(() => {
              const total   = pagination.last_page;
              const current = pagination.current_page;
              const pages: (number | "…")[] = [];

              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 3) pages.push("…");
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                  pages.push(i);
                }
                if (current < total - 2) pages.push("…");
                pages.push(total);
              }

              return pages.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => pushPage(p)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      p === current
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}
            <button
              onClick={() => pushPage(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showUpload && (
        <MediaUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            router.refresh();
          }}
        />
      )}
      {editFile && (
        <MediaEditDialog
          file={editFile}
          onClose={() => setEditFile(null)}
          onDeleted={() => {
            setEditFile(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
