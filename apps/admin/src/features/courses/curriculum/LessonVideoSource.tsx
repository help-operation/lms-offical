"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle, Loader2, Link, Cloud } from "lucide-react";
import { setExternalUrlAction } from "@/features/courses/actions/upload.actions";
import { toast } from "@repo/ui/sonner";

type ExternalUrlResult = { success: boolean; message?: string; data?: unknown };

/**
 * Best-effort client-side duration lookup for an external video URL, so the
 * Duration field doesn't need to be filled in by hand. Vimeo exposes it via a
 * public oEmbed call; direct video files (mp4/webm/…) can be read via a
 * hidden <video> element. YouTube and other iframe embeds aren't detectable
 * without provider API keys, so those fall back to manual entry.
 */
async function detectExternalVideoDuration(url: string): Promise<number | undefined> {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "vimeo.com") {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (!res.ok) return undefined;
      const data = await res.json();
      return typeof data.duration === "number" && data.duration > 0
        ? Math.round(data.duration)
        : undefined;
    }
  } catch {
    return undefined;
  }

  if (!/\.(mp4|webm|ogg|mov|m3u8)$/i.test(url)) return undefined;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const timeout = setTimeout(() => resolve(undefined), 6000);
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
    };
    video.onerror = () => {
      clearTimeout(timeout);
      resolve(undefined);
    };
    video.src = url;
  });
}

interface LessonVideoSourceProps {
  lessonId: number;
  lessonTitle?: string;
  currentSource: "bunny" | "external" | null;
  currentExternalUrl: string | null;
  onComplete: (update: { videoSource: "bunny" | "external"; externalVideoUrl?: string; duration?: number }) => void;
  onClose: () => void;
  /**
   * Called when the user picks a video file on the Bunny tab. The parent owns
   * the actual upload (so it survives this modal closing and runs inline on the
   * lesson row), so this modal just hands back the chosen file and closes.
   */
  onPickFile: (file: File) => void;
  /** Override to supply a different external-url action (e.g. for live lessons) */
  setExternalUrlAction?: (lessonId: number, url: string, duration?: number) => Promise<ExternalUrlResult>;
  /**
   * Overlay positioning:
   *  - "modal" (default): full-viewport fixed overlay that blocks the whole page.
   *  - "contained": absolute overlay scoped to the nearest positioned ancestor,
   *    so it covers only its column and the rest of the page stays interactive.
   */
  variant?: "modal" | "contained";
}

type Tab = "bunny" | "external";

export function LessonVideoSource({
  lessonId,
  lessonTitle,
  currentSource,
  currentExternalUrl,
  onComplete,
  onClose,
  onPickFile,
  setExternalUrlAction: saveExternalUrl = setExternalUrlAction,
  variant = "modal",
}: LessonVideoSourceProps) {
  const [tab, setTab] = useState<Tab>(currentSource ?? "bunny");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── External URL state ───────────────────────────────────────────────────────
  const [externalUrl, setExternalUrl] = useState(currentExternalUrl ?? "");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlSaved, setUrlSaved] = useState(false);

  // ── Bunny: selection only — the parent runs the upload on the lesson row ──────

  function pickFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }
    onPickFile(file);
    onClose();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  // ── External URL save ────────────────────────────────────────────────────────

  async function handleSaveUrl() {
    const trimmed = externalUrl.trim();
    if (!trimmed) { setUrlError("Please enter a URL"); return; }

    try { new URL(trimmed); } catch {
      setUrlError("Please enter a valid URL");
      return;
    }

    setSavingUrl(true);
    setUrlError(null);

    const duration = await detectExternalVideoDuration(trimmed);
    const res = await saveExternalUrl(lessonId, trimmed, duration);
    setSavingUrl(false);

    if (!res.success) {
      const msg = res.message ?? "Failed to save URL";
      setUrlError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Video URL saved");
    setUrlSaved(true);
    setTimeout(() => {
      onComplete({ videoSource: "external", externalVideoUrl: trimmed, duration });
    }, 1000);
  }

  const contained = variant === "contained";

  return (
    <div
      className={`${
        contained ? "absolute items-start pt-6" : "fixed items-center bg-black/50 backdrop-blur-sm"
      } inset-0 z-50 flex justify-center p-4`}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-md mx-4 ${
          contained ? "shadow-xl border border-gray-200" : "shadow-2xl"
        }`}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Video Source</h3>
            {lessonTitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">{lessonTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mx-6 mb-5 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTab("bunny")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-colors ${
              tab === "bunny"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Bunny Stream
          </button>
          <button
            type="button"
            onClick={() => setTab("external")}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-colors ${
              tab === "external"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            External Link
          </button>
        </div>

        <div className="px-6 pb-6">

          {/* ── Bunny tab — pick a file; upload runs on the lesson row ───────── */}
          {tab === "bunny" && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-10 text-center cursor-pointer transition-colors group"
              >
                <Upload className="h-8 w-8 text-gray-300 group-hover:text-indigo-400 mx-auto mb-3 transition-colors" />
                <p className="text-sm font-medium text-gray-700">Drop video here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — any size, resumable upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Upload continues on the lesson row — you can keep working while it finishes.
              </p>
            </>
          )}

          {/* ── External tab ──────────────────────────────────────────────── */}
          {tab === "external" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Video URL
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => { setExternalUrl(e.target.value); setUrlError(null); setUrlSaved(false); }}
                  placeholder="https://youtube.com/watch?v=… or https://example.com/video.mp4"
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                {urlError && (
                  <p className="mt-1.5 text-xs text-red-600">{urlError}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  Supports YouTube, Vimeo, MP4, HLS, or any direct video URL.
                </p>
              </div>

              {urlSaved ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Saved!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  disabled={savingUrl || !externalUrl.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {savingUrl ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    "Save URL"
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
