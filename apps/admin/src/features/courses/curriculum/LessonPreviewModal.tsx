"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { apiRequestBrowser } from "@/lib/api-client-browser";

type Playback =
  | { source: "bunny"; iframeUrl: string; status: string }
  | { source: "external"; url: string };

function toEmbed(url: string): { kind: "iframe" | "video"; src: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}?autoplay=1` };
    }
    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed${u.pathname}?autoplay=1` };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}?autoplay=1` };
    }
    if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return { kind: "video", src: url };
  } catch {
    /* invalid URL */
  }
  return { kind: "iframe", src: url };
}

interface Props {
  lessonId: number;
  lessonTitle: string;
  onClose: () => void;
  /** API path that resolves playback (defaults to the recorded course path). */
  playbackPath?: string;
}

export function LessonPreviewModal({ lessonId, lessonTitle, onClose, playbackPath }: Props) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequestBrowser<Playback>(playbackPath ?? `/course-builder/lessons/${lessonId}/playback`)
      .then((res) => setPlayback(res.data))
      .catch((e) => setError(e?.message ?? "Failed to load video"));
  }, [lessonId, playbackPath]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium text-sm truncate max-w-[80%]">{lessonTitle}</p>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Player area */}
        <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {!playback && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}

          {playback?.source === "bunny" && (
            <iframe
              src={playback.iframeUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}

          {playback?.source === "external" && (() => {
            const embed = toEmbed(playback.url);
            if (embed.kind === "video") {
              return (
                <video
                  src={embed.src}
                  controls
                  autoPlay
                  className="absolute inset-0 h-full w-full"
                />
              );
            }
            return (
              <iframe
                src={embed.src}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
