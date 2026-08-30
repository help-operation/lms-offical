"use client";

import { useCallback, useRef, useState } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader2, FileIcon } from "lucide-react";
import { presignMediaAction, registerMediaAction } from "@/features/media/actions/media.actions";
import { formatFileSize } from "@/features/media/types";
import { toast } from "@repo/ui/sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadItem {
  file:     File;
  status:   "pending" | "uploading" | "done" | "error";
  progress: number;   // 0–100 for XHR progress
  errorMsg?: string;
}

interface MediaUploadModalProps {
  onClose: () => void;
  /** Called after at least one file is successfully uploaded */
  onUploaded: (urls: string[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upload one file: presign → PUT to R2 with progress → register in DB. Returns public URL. */
function uploadOneFile(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // 1. Get presigned URL from NestJS via Server Action
    const presignRes = await presignMediaAction(file.type || "application/octet-stream", file.name);
    if (!presignRes.success) {
      reject(new Error(presignRes.message));
      return;
    }
    const { presignedUrl, publicUrl, key } = presignRes.data;

    // 2. PUT directly to R2 with XHR so we get upload progress
    await new Promise<void>((xhrResolve, xhrReject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 90)); // leave 10% for register step
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          xhrResolve();
        } else {
          xhrReject(new Error(`R2 upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => xhrReject(new Error("Network error during upload")));
      xhr.addEventListener("abort", () => xhrReject(new Error("Upload aborted")));

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);
    });

    onProgress(95);

    // 3. Register the file in the DB via Server Action
    const registerRes = await registerMediaAction({
      url:          publicUrl,
      key,
      filename:     file.name,
      originalName: file.name,
      mimeType:     file.type || "application/octet-stream",
      size:         file.size,
    });

    if (!registerRes.success) {
      reject(new Error(registerRes.message));
      return;
    }

    onProgress(100);
    resolve(publicUrl);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaUploadModal({ onClose, onUploaded }: MediaUploadModalProps) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [items, setItems]     = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const next: UploadItem[] = Array.from(newFiles).map((f) => ({
      file:     f,
      status:   "pending",
      progress: 0,
    }));
    setItems((prev) => [...prev, ...next]);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function updateItem(index: number, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleUpload() {
    const pendingIndices = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.status === "pending")
      .map(({ i }) => i);

    if (!pendingIndices.length || uploading) return;
    setUploading(true);

    // Upload files sequentially so we don't hit presign rate limits
    const uploadedUrls: string[] = [];
    let errorCount = 0;
    for (const idx of pendingIndices) {
      const item = items[idx];
      if (!item) continue;
      updateItem(idx, { status: "uploading", progress: 0 });
      try {
        const url = await uploadOneFile(item.file, (pct) =>
          updateItem(idx, { progress: pct }),
        );
        updateItem(idx, { status: "done", progress: 100 });
        uploadedUrls.push(url);
      } catch (err) {
        updateItem(idx, {
          status:   "error",
          errorMsg: err instanceof Error ? err.message : "Upload failed",
        });
        errorCount += 1;
      }
    }

    setUploading(false);
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} file${uploadedUrls.length !== 1 ? "s" : ""} uploaded`);
      onUploaded(uploadedUrls);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount !== 1 ? "s" : ""} failed to upload`);
    }
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const allDone      = items.length > 0 && items.every((i) => i.status === "done");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Upload Files</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              Drop files here or{" "}
              <span className="text-indigo-600">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Uploaded directly to Cloudflare R2 — images, videos, audio, documents
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {items.length > 0 && (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-gray-400 shrink-0">
                        {formatFileSize(item.file.size)}
                      </p>
                      {/* Progress bar */}
                      {item.status === "uploading" && (
                        <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status icon */}
                  {item.status === "pending" && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Queue
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="shrink-0 text-[10px] font-semibold text-indigo-500">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === "done" && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                  {item.status === "error" && (
                    <span title={item.errorMsg}>
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {allDone ? "Close" : "Cancel"}
          </button>

          {!allDone && (
            <button
              onClick={handleUpload}
              disabled={pendingCount === 0 || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading
                ? "Uploading…"
                : `Upload ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
