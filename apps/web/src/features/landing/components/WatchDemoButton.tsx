"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

interface Props {
  label: string;
  videoUrl: string;
}

function toEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  return url;
}

export function WatchDemoButton({ label, videoUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-4 transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer"
      >
        <div className="w-[45px] h-[45px] rounded-full relative shrink-0">
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:6s] bg-[conic-gradient(var(--color-brand-ring)_0%_60%,white_60%_65%,var(--color-brand-ring)_65%_70%,white_70%_75%,var(--color-brand-ring)_75%_80%,white_85%_90%,var(--color-brand-ring)_90%_95%,white_95%_100%)] [mask:radial-gradient(closest-side,transparent_85%,black_96%)] [-webkit-mask:radial-gradient(closest-side,transparent_90%,black_95%)]" />
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-4 w-4 fill-red-500 text-red-500" aria-hidden="true" />
          </div>
        </div>
        <p className="text-[18px] leading-[23px] font-[700] text-ink dark:text-white">{label}</p>
      </button>

      {/* Video Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Video */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={toEmbedUrl(videoUrl)}
                className="h-full w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Demo video"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
