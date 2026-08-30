"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface VideoTestimonialItem {
  title: string;
  videoUrl: string;
}

export interface VideoTestimonialsData {
  title?: string;
  items?: VideoTestimonialItem[];
}

const DEFAULT_VIDEOS: VideoTestimonialItem[] = [
  {
    title: "Student Review ???? ??? ?????? ????? ????????",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    title: "Mastery ????? ????? ???? ?? ???? ????",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    title: "Mastery ?? ???? ??????????? ????????",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/);
  return match?.[1] ?? null;
}

export function MasteryVideoTestimonials({ data }: { data?: VideoTestimonialsData }) {
  const title = data?.title || "???? ?????? ??? ????? ??????? \u2013 ????? ???? ???";
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_VIDEOS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemsPerPage = 1;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const cardStep = 370; // 350 + 20 gap

  const scrollToPage = useCallback((page: number) => {
    if (!scrollRef.current || totalPages === 0) return;
    const normalized = ((page % totalPages) + totalPages) % totalPages;
    scrollRef.current.scrollTo({ left: normalized * cardStep, behavior: "smooth" });
    setCurrentPage(normalized);
  }, [totalPages]);

  function scroll(direction: "left" | "right") {
    scrollToPage(direction === "left" ? currentPage - 1 : currentPage + 1);
  }

  const updatePage = useCallback(() => {
    if (!scrollRef.current) return;
    const page = Math.round(scrollRef.current.scrollLeft / cardStep);
    const normalized = ((page % totalPages) + totalPages) % totalPages;
    if (normalized !== currentPage) setCurrentPage(normalized);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updatePage);
    return () => el.removeEventListener("scroll", updatePage);
  }, [updatePage]);

  // Infinite auto-loop every 4s (pauses on hover)
  useEffect(() => {
    if (totalPages <= 1 || isPaused) return;
    const id = setInterval(() => scrollToPage(currentPage + 1), 4000);
    return () => clearInterval(id);
  }, [currentPage, totalPages, scrollToPage, isPaused]);

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] pt-10 pb-0">
      <h2
        className="text-center font-bold text-black mb-3"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(28px, 5vw, 35px)' }}
      >
        {title}
      </h2>

      <div className="relative">

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {[...items, ...items.slice(0, 2)].map((item, index) => {
            const videoId = extractYouTubeId(item.videoUrl);
            return (
              <div key={index} className="shrink-0 w-[350px] snap-start">
                <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                  {videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                      title={item.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <span className="text-gray-400 text-sm">No video</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentPage === i ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}