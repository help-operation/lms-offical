"use client";

import { Loader2, X } from "lucide-react";
import type { UploadEntry } from "./useLessonVideoUploads";

/**
 * Inline per-lesson upload indicator shown on a curriculum row while its video
 * is uploading to Bunny. Replaces the status badge / "Change Video" cluster for
 * that lesson until the upload finishes (then the row flips to Processing).
 */
export function LessonUploadProgress({
  entry,
  onCancel,
}: {
  entry: UploadEntry;
  onCancel: () => void;
}) {
  if (entry.state === "error") {
    return (
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700"
        title={entry.error}
      >
        Upload failed
      </span>
    );
  }

  const preparing = entry.state === "preparing";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-200"
          style={{ width: `${preparing ? 4 : entry.progress}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 tabular-nums w-9 text-right">
        {preparing ? (
          <Loader2 className="inline h-3 w-3 animate-spin" />
        ) : (
          `${entry.progress}%`
        )}
      </span>
      <button
        type="button"
        onClick={onCancel}
        title="Cancel upload"
        className="text-gray-300 hover:text-red-500 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
