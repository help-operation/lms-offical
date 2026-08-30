"use client";

import { Play } from "lucide-react";
import type { PreviewSlide } from "@/features/courses/api";

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null;
    }
  } catch {}
  return null;
}

export function vimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}

export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] ?? null;
  } catch {}
  return null;
}

// ─── Slide renderer ───────────────────────────────────────────────────────────

export function SlideRenderer({ slide }: { slide: PreviewSlide }) {
  if (slide.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slide.url}
        alt="Course preview"
        className="h-full w-full object-cover"
      />
    );
  }

  // Video — detect embed type
  const ytUrl = youtubeEmbedUrl(slide.url);
  if (ytUrl) {
    return (
      <iframe
        src={ytUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    );
  }

  const vmUrl = vimeoEmbedUrl(slide.url);
  if (vmUrl) {
    return (
      <iframe
        src={vmUrl}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo video"
      />
    );
  }

  // Direct video (R2 .mp4, etc.)
  return (
    <video
      src={slide.url}
      controls
      className="h-full w-full object-cover"
    />
  );
}

// ─── Thumbnail strip item ─────────────────────────────────────────────────────

export function ThumbItem({
  slide,
  active,
  onClick,
}: {
  slide: PreviewSlide;
  active: boolean;
  onClick: () => void;
}) {
  // For video slides, try to get a preview thumbnail image
  let thumbSrc: string | null = null;
  if (slide.type === "video") {
    const ytId = youtubeVideoId(slide.url);
    if (ytId) {
      thumbSrc = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    // Vimeo doesn't offer a public unauthenticated thumbnail — leave null
  } else {
    thumbSrc = slide.url;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-video w-16 shrink-0 overflow-hidden rounded-md border transition-all ${
        active ? "border-brand-500 ring-2 ring-brand-400/60" : "border-gray-100 dark:border-gray-700"
      } bg-gray-100 dark:bg-gray-800`}
    >
      {thumbSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700" />
      )}
      {/* Play overlay for video slides */}
      {slide.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Play className="h-3 w-3 fill-white text-white drop-shadow" />
        </span>
      )}
    </button>
  );
}
