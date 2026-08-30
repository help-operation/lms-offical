"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface VideoTestimonialItem {
  title: string;
  videoUrl: string;
}

export interface VideoTestimonialsData {
  title?: string;
  items: VideoTestimonialItem[];
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

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] pt-10 pb-0">
      <h2
        className="text-center font-bold text-black mb-3"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(28px, 5vw, 35px)' }}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.slice(0, 3).map((item, index) => {
          const videoId = extractYouTubeId(item.videoUrl);
          return (
            <div key={index} className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video group">
              {videoId ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 right-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">M</span>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">Mastery</span>
                    </div>
                    <p className="text-white text-sm font-semibold drop-shadow-lg line-clamp-2">{item.title}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <span className="text-gray-400 text-sm">No video</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}