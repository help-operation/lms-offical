"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Loader2, Upload, CloudUpload } from "lucide-react";
import { fetchMediaListAction, presignMediaAction, registerMediaAction } from "@/features/media/actions/media.actions";
import { MediaPreview } from "./MediaPreview";
import type { MediaFile, MediaType, MediaPagination } from "@/features/media/types";

// Files fetched per page in the picker.
const PER_PAGE = 10;

interface MediaLibraryModalProps {
  /** Called with the selected file when user confirms */
  onSelect: (file: MediaFile) => void;
  onClose: () => void;
  /** Restrict the picker to a specific file type */
  filterType?: MediaType;
  /** Allow picking multiple files (default: false — single pick) */
  multiple?: boolean;
}

export function MediaLibraryModal({
  onSelect,
  onClose,
  filterType,
  multiple = false,
}: MediaLibraryModalProps) {
  const [files,       setFiles]      = useState<MediaFile[]>([]);
  const [search,      setSearch]     = useState("");
  const [loading,     setLoading]    = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]       = useState(1);
  const [pagination,  setPagination] = useState<MediaPagination | null>(null);
  const [picked,      setPicked]     = useState<Set<number>>(new Set());
  const [uploading,   setUploading]  = useState(false);
  const [dragOver,    setDragOver]   = useState(false);
  const [showUpload,  setShowUpload] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const presignRes = await presignMediaAction(file.type || "application/octet-stream", file.name);
      if (!presignRes.success) throw new Error(presignRes.message);
      const { presignedUrl, publicUrl, key } = presignRes.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      await registerMediaAction({
        url: publicUrl, key,
        filename: file.name, originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });

      // Reload from page 1 (the new file is newest) and close upload zone
      await load(search, 1, false);
      setShowUpload(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((f) => uploadFile(f));
  }

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Load files via Server Action (runs on server, has cookie access).
  // `append` keeps the existing list and adds the next page (Load more);
  // otherwise the list is replaced (initial load, search, or page jump).
  const load = useCallback((searchValue: string, pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    fetchMediaListAction({
      search:  searchValue || undefined,
      type:    filterType,
      page:    pageNum,
      perPage: PER_PAGE,
    })
      .then((res) => {
        if (res.success) {
          setFiles((prev) => (append ? [...prev, ...res.data.data] : res.data.data));
          setPagination(res.data.pagination);
          setPage(pageNum);
        }
      })
      .catch(() => {})
      .finally(() => { if (append) setLoadingMore(false); else setLoading(false); });
  }, [filterType]);

  // Initial load
  useEffect(() => {
    load("", 1, false);
  }, [load]);

  // Debounced search — always resets to page 1
  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value, 1, false), 400);
  }

  function togglePick(file: MediaFile) {
    if (!multiple) {
      // Single pick — confirm immediately
      onSelect(file);
      return;
    }
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(file.id)) next.delete(file.id); else next.add(file.id);
      return next;
    });
  }

  function confirmMulti() {
    const selected = files.filter((f) => picked.has(f.id));
    selected.forEach((f) => onSelect(f));
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {multiple ? "Select Files" : "Select File"}
            {filterType && (
              <span className="ml-2 text-xs font-normal text-gray-400 capitalize">
                ({filterType}s only)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showUpload
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inline upload zone */}
        {showUpload && (
          <div className="shrink-0 border-b border-gray-100 px-6 py-4">
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              accept={filterType === "image" ? "image/*" : filterType === "video" ? "video/*" : undefined}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => uploadInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors ${
                dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
              }`}
            >
              {uploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              ) : (
                <CloudUpload className="h-7 w-7 text-gray-300" />
              )}
              <p className="text-sm font-medium text-gray-500">
                {uploading ? "Uploading…" : "Click or drag & drop to upload"}
              </p>
              {!uploading && (
                <p className="text-xs text-gray-400">
                  {filterType ? `${filterType}s only` : "Any file type"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="shrink-0 border-b border-gray-100 px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search files…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">
              No files found.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {files.map((file) => {
                const isPicked = picked.has(file.id);
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => togglePick(file)}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isPicked
                        ? "border-indigo-400 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Check badge */}
                    {isPicked && (
                      <div className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="aspect-video overflow-hidden">
                      <MediaPreview file={file} className="h-full w-full" />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {file.filename}
                      </p>
                      <p className="text-[10px] text-gray-400">{file.formattedSize}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination — Load more (append) + numbered pager (jump) */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => load(search, page + 1, true)}
              disabled={loadingMore || page >= pagination.last_page}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {loadingMore ? "Loading…" : page >= pagination.last_page ? "All loaded" : "Load more"}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => load(search, pagination.current_page - 1, false)}
                disabled={pagination.current_page <= 1}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              {(() => {
                const total   = pagination.last_page;
                const current = pagination.current_page;
                const pages: (number | "…")[] = [];
                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (current > 3) pages.push("…");
                  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
                  if (current < total - 2) pages.push("…");
                  pages.push(total);
                }
                return pages.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => load(search, p, false)}
                      className={`min-w-[28px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        p === current
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                );
              })()}
              <button
                onClick={() => load(search, pagination.current_page + 1, false)}
                disabled={pagination.current_page >= pagination.last_page}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer — only shown in multi-select mode */}
        {multiple && (
          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
            <span className="text-sm text-gray-500">
              {picked.size} file{picked.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMulti}
                disabled={picked.size === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Insert {picked.size > 0 ? picked.size : ""}{" "}
                {picked.size !== 1 ? "files" : "file"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
