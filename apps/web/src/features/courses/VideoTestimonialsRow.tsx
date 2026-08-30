"use client";

import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

type Item = { name: string; role: string; image: string };

export function VideoTestimonialsRow({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Previous"
        className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-600 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Next"
        className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-600 hover:text-white transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, i) => (
          <div
            key={i}
            className="shrink-0 w-[320px] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
          >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-900">
              <img
                src={t.image}
                alt={t.name}
                className="h-full w-full object-cover opacity-90"
              />
              <button
                aria-label={`Play ${t.name}`}
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 ring-4 ring-white/40 backdrop-blur-sm transition-transform hover:scale-110"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <Play className="h-4 w-4 fill-brand-600 text-brand-600" />
                </span>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3 px-1 pb-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {t.name[0]}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-ink-soft">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
