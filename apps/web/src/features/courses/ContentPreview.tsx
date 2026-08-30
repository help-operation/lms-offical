"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Play, FileText, X, Loader2 } from "lucide-react";
import { apiRequestBrowser } from "@/lib/api-client-browser";
import { trackVideoEngagement, type VideoEngagementAction } from "@/shared/utils/dataLayer";

export type PreviewLesson = {
  id: number;
  title: string;
  type: string;
  isFree: boolean;
};
export type PreviewModule = {
  id: number;
  title: string;
  lessons: PreviewLesson[];
};

type PlaybackInfo =
  | { source: "bunny"; iframeUrl: string; status: "processing" | "ready" | "failed" | null }
  | { source: "external"; url: string };

// Turn an external video URL into an embeddable iframe/video source.
function toEmbed(url: string): { kind: "iframe" | "video"; src: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed${u.pathname}` };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg|mov|m3u8)$/i.test(u.pathname)) return { kind: "video", src: url };
  } catch {
    /* not a valid URL */
  }
  return { kind: "iframe", src: url };
}

function LessonRow({
  lesson,
  onPreview,
}: {
  lesson: PreviewLesson;
  onPreview: (lesson: PreviewLesson) => void;
}) {
  const isVideo = lesson.type?.toLowerCase().includes("video") ?? false;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            lesson.isFree
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
          }`}
        >
          {isVideo ? (
            <Play className="h-3 w-3 fill-current" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="truncate text-sm text-gray-700 dark:text-gray-300">{lesson.title}</span>
      </div>
      {lesson.isFree && (
        <button
          type="button"
          onClick={() => onPreview(lesson)}
          className="shrink-0 cursor-pointer text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Free preview
        </button>
      )}
    </div>
  );
}

function PreviewModal({
  lesson,
  onClose,
}: {
  lesson: PreviewLesson;
  onClose: () => void;
}) {
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch once when the modal mounts (keyed by lesson.id from the parent).
  useEffect(() => {
    let cancelled = false;
    apiRequestBrowser<PlaybackInfo>(`/lessons/${lesson.id}/preview`)
      .then((res) => {
        if (!cancelled) setPlayback(res.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Preview not available");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-video w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/70">
              {error}
            </div>
          )}

          {!loading && !error && playback && (
            <PlayerBody playback={playback} title={lesson.title} videoId={String(lesson.id)} />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <span className="truncate text-sm font-semibold text-white">
            {lesson.title}
          </span>
          <span className="shrink-0 rounded-full bg-brand-600/20 px-2.5 py-0.5 text-xs font-bold text-brand-200">
            Free preview
          </span>
        </div>
      </div>
    </div>
  );
}

// Engagement tracking is only wired for the native <video> path — Bunny/YouTube/Vimeo
// render as cross-origin <iframe>s and would each need their own postMessage API
// integration to instrument reliably, which is out of scope for this pass.
function TrackedVideo({ src, videoId }: { src: string; videoId: string }) {
  const firedRef = useRef<Set<VideoEngagementAction | 25 | 50 | 75 | 100>>(new Set());

  return (
    <video
      src={src}
      controls
      autoPlay
      className="absolute inset-0 h-full w-full"
      onPlay={() => {
        if (firedRef.current.has("start")) return;
        firedRef.current.add("start");
        trackVideoEngagement(videoId, "start");
      }}
      onPause={() => trackVideoEngagement(videoId, "pause")}
      onEnded={() => trackVideoEngagement(videoId, "complete")}
      onTimeUpdate={(e) => {
        const video = e.currentTarget;
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        for (const threshold of [25, 50, 75, 100] as const) {
          if (pct >= threshold && !firedRef.current.has(threshold)) {
            firedRef.current.add(threshold);
            trackVideoEngagement(videoId, "progress", threshold);
          }
        }
      }}
    />
  );
}

function PlayerBody({ playback, title, videoId }: { playback: PlaybackInfo; title: string; videoId: string }) {
  if (playback.source === "bunny") {
    if (playback.status && playback.status !== "ready") {
      return (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/70">
          This preview is still processing. Please check back shortly.
        </div>
      );
    }
    return (
      <iframe
        src={playback.iframeUrl}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const embed = toEmbed(playback.url);
  if (embed.kind === "video") {
    return <TrackedVideo src={embed.src} videoId={videoId} />;
  }
  return (
    <iframe
      src={embed.src}
      title={title}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

export function ContentPreview({ modules }: { modules: PreviewModule[] }) {
  const [open, setOpen] = useState<number[]>(
    modules[0] ? [modules[0].id] : [],
  );
  const [showAll, setShowAll] = useState(false);
  const [preview, setPreview] = useState<PreviewLesson | null>(null);

  const toggle = (id: number) =>
    setOpen((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const visible = showAll ? modules : modules.slice(0, 5);

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
      {visible.map((m, i) => {
        const isOpen = open.includes(m.id);
        const last = i === visible.length - 1;
        return (
          <div
            key={m.id}
            className={last ? "" : "border-b border-dashed border-gray-200 dark:border-gray-800"}
          >
            <button
              onClick={() => toggle(m.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="text-base font-bold text-gray-900 dark:text-white">
                {m.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 ${
                  isOpen ? "rotate-180 text-brand-600 dark:text-brand-400" : ""
                }`}
              />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="divide-y divide-gray-50 px-6 pb-4 dark:divide-gray-800">
                  {m.lessons.map((l) => (
                    <LessonRow key={l.id} lesson={l} onPreview={setPreview} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {modules.length > 5 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="-mb-4 translate-y-1/2 rounded-full border border-gray-200 bg-white px-5 py-1.5 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {showAll ? "Show less" : "All content"}
          </button>
        </div>
      )}

      {preview && (
        <PreviewModal
          key={preview.id}
          lesson={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
