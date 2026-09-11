"use client";

import { useState } from "react";
import { X, Loader2, Play, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";

// ── Allowed embed domains ─────────────────────────────────────────────────────

const ALLOWED_PATTERNS: { platform: string; regex: RegExp; embed: (m: RegExpMatchArray) => string }[] = [
  {
    platform: "YouTube",
    // youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., youtube.com/embed/...
    regex: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
    embed: (m) => `https://www.youtube.com/embed/${m[1]}`,
  },
  {
    platform: "Vimeo",
    // vimeo.com/123456789, player.vimeo.com/video/123456789
    regex: /^(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/,
    embed: (m) => `https://player.vimeo.com/video/${m[1]}`,
  },
  {
    platform: "Facebook",
    // facebook.com/plugins/video.php?href=... or direct facebook.com/.../videos/...
    regex: /^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com\/(?:.*\/videos\/\d+|plugins\/video\.php\?.*href=.+)|fb\.com\/.*\/videos\/\d+)/,
    embed: (m) => {
      const url = m[0];
      if (url.includes("plugins/video.php")) return url;
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    },
  },
];

export function validateEmbedUrl(url: string): { valid: boolean; embedUrl?: string; platform?: string; error?: string } {
  const trimmed = url.trim();
  for (const { platform, regex, embed } of ALLOWED_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      return { valid: true, embedUrl: embed(match), platform };
    }
  }
  return {
    valid: false,
    error: "URL not recognized. Supported: YouTube, Vimeo, Facebook video links.",
  };
}

// ── Embed Dialog ──────────────────────────────────────────────────────────────

interface EmbedDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string) => void;
}

export function EmbedDialog({ open, onClose, onInsert }: EmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);

  function handleUrlChange(val: string) {
    setUrl(val);
    setError(null);
    setPreview(null);
    setPlatform(null);

    if (!val.trim()) return;

    const result = validateEmbedUrl(val);
    if (result.valid) {
      setPreview(result.embedUrl!);
      setPlatform(result.platform ?? null);
    } else {
      setError(result.error ?? "Invalid URL");
    }
  }

  function handleInsert() {
    if (!preview) return;
    setLoading(true);
    // Simulate brief loading for UX
    setTimeout(() => {
      onInsert(preview);
      setUrl("");
      setPreview(null);
      setPlatform(null);
      setError(null);
      setLoading(false);
      onClose();
    }, 200);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Insert Embed</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Platform chips */}
          <div className="flex gap-2">
            {["YouTube", "Vimeo", "Facebook"].map((p) => (
              <span
                key={p}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  platform === p
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {p}
              </span>
            ))}
          </div>

          {/* URL input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Paste a link
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {error && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <iframe
                src={preview}
                className="h-56 w-full"
                frameBorder="0"
                allowFullScreen
                title="Embed preview"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!preview || loading}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Insert
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
