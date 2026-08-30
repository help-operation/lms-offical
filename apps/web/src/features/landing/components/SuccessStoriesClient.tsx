"use client";

import { useMemo, useState, useCallback } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import type { PublicSuccessStory } from "@/features/cms/api/success-stories";

type Filter = { key: string; label: string };

type Props = {
  titlePrefix:    string;
  titleHighlight: string;
  subtitle:       string;
  seeMoreLabel:   string;
  seeMoreLink:    string;
  filters:        Filter[];
  stories:        PublicSuccessStory[];
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const StoryCard = ({ s }: { s: PublicSuccessStory }) => {
  const [playing, setPlaying] = useState(false);

  const ytId = s.videoUrl ? extractYouTubeId(s.videoUrl) : null;
  const thumbnail = s.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "");

  function toEmbedUrl(url: string) {
    const id = extractYouTubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    return url;
  }

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl shadow-md">
      {playing && s.videoUrl ? (
        <iframe
          src={toEmbedUrl(s.videoUrl)}
          className="h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={s.name}
        />
      ) : (
        <>
          <img
            src={thumbnail}
            alt={s.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30" />

          {s.videoUrl && (
            <button
              onClick={() => setPlaying(true)}
              aria-label={`Play ${s.name}'s story`}
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/30 backdrop-blur-sm ring-4 ring-white/40 transition-transform hover:scale-110"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Play className="h-5 w-5 fill-brand-600 text-brand-600" />
              </span>
            </button>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/60 px-3 py-1 text-center text-white">
            <p className="text-sm font-bold">{s.name}</p>
            <p className="text-[11px] text-white/80">Batch no: {s.batch}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default function SuccessStoriesClient({
  titlePrefix, titleHighlight, subtitle,
  seeMoreLabel, seeMoreLink, filters, stories,
}: Props) {
  const [filter, setFilter] = useState(filters[0]?.key ?? "all");

  const filtered = useMemo(
    () => (filter === "all" ? stories : stories.filter((s) => s.category === filter)),
    [filter, stories],
  );

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-[44px] font-bold text-gray-900 dark:text-white">
          {titlePrefix}{" "}
          <span className="relative text-accent">
            {titleHighlight}
            <span className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-red-500/70" />
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>

        {/* Filter tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {filters.map((f) => {
            const isActive = f.key === filter;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-md px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StoryCard key={s.id} s={s} />
          ))}
        </div>

        {/* See more */}
        <div className="mt-12 flex justify-center">
          <Link
            href={seeMoreLink}
            className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
          >
            {seeMoreLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
