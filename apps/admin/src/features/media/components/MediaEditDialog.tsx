"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Copy, Check, Trash2, Loader2, Expand } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import {
  updateMediaAction,
  deleteMediaAction,
} from "@/features/media/actions/media.actions";
import { MediaPreview } from "./MediaPreview";
import type { MediaFile } from "@/features/media/types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface MediaEditDialogProps {
  file: MediaFile;
  onClose: () => void;
  onDeleted: () => void;
}

export function MediaEditDialog({ file, onClose, onDeleted }: MediaEditDialogProps) {
  const { formatDate } = useLocalization();
  const [filename,  setFilename]  = useState(file.filename);
  const [altText,   setAltText]   = useState(file.altText  ?? "");
  const [caption,   setCaption]   = useState(file.caption  ?? "");
  const [copied,    setCopied]    = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox,  setLightbox]  = useState(false);

  const [isSaving,  startSave]   = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // ESC closes dialog (unless an action is in flight)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSaving && !isDeleting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isSaving, isDeleting]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function copyUrl() {
    navigator.clipboard.writeText(file.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    startSave(async () => {
      const res = await updateMediaAction(file.id, {
        filename: filename.trim() || undefined,
        altText:  altText.trim()  || undefined,
        caption:  caption.trim()  || undefined,
      });
      if (res.success) {
        toast.success("File updated");
        onClose();
      } else {
        toast.error(res.message ?? "Update failed");
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteMediaAction(file.id);
      if (res.success) {
        toast.success("File deleted");
        onDeleted();
      } else {
        toast.error(res.message ?? "Delete failed");
      }
    });
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="truncate pr-4 text-base font-semibold text-gray-900">
            {file.filename}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-y-auto sm:flex-row">
          {/* Preview panel */}
          <div className="shrink-0 border-b border-gray-100 sm:w-64 sm:border-b-0 sm:border-r">
            <div className="p-4">
              {(() => {
                const previewable = file.type === "image" || file.type === "video" || file.type === "audio";
                const hint =
                  file.type === "image" ? "View full size" :
                  file.type === "video" ? "Play video" :
                  "Play audio";
                return (
                  <div
                    className={`group relative overflow-hidden rounded-xl border border-gray-100 shadow-sm ${previewable ? (file.type === "image" ? "cursor-zoom-in" : "cursor-pointer") : ""}`}
                    onClick={() => previewable && setLightbox(true)}
                  >
                    <MediaPreview
                      file={file}
                      className="aspect-video w-full sm:aspect-auto sm:h-44"
                    />
                    {/* Expand/play hint */}
                    {previewable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100">
                          <Expand className="h-3.5 w-3.5 text-gray-700" />
                          <span className="text-xs font-medium text-gray-700">{hint}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1.5 px-4 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Details</p>
              <p className="text-xs text-gray-600">Size: {file.formattedSize}</p>
              <p className="text-xs text-gray-600 break-all">Type: {file.mimeType}</p>
              <p className="text-xs text-gray-600">
                Uploaded:{" "}
                {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex-1 space-y-4 p-6">
            {/* URL (read-only + copy) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">
                File URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={file.url}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 outline-none truncate"
                />
                <button
                  onClick={copyUrl}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">
                Filename
              </label>
              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Alt Text */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">
                Alt Text{" "}
                <span className="normal-case font-normal text-gray-400">(for images)</span>
              </label>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-500">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Optional caption…"
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Delete confirmation */}
            {confirmDelete && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-2 text-sm font-medium text-red-700">
                  Delete this file permanently? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={confirmDelete || isDeleting}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete file
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Lightbox / media preview ────────────────────────────────────────── */}
    {lightbox && (file.type === "image" || file.type === "video" || file.type === "audio") && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => setLightbox(false)}
      >
        {/* Close */}
        <button
          onClick={() => setLightbox(false)}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        {file.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.altText || file.filename}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Video */}
        {file.type === "video" && (
          <video
            src={file.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Audio */}
        {file.type === "audio" && (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 p-8 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-white">{file.filename}</p>
            <audio src={file.url} controls autoPlay className="w-80 max-w-[80vw]" />
          </div>
        )}

        {/* Filename caption */}
        {file.type !== "audio" && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white/80">
            {file.filename}
          </p>
        )}
      </div>
    )}
    </>
  );
}
