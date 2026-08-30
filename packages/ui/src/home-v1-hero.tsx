"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Play, Search, Users } from "lucide-react";
import { CountUpNumber } from "./home-v1-count-up-number";

export type HeroV2Content = {
  title_line1?: string;
  title_line2?: string;
  subtitle?: string;
  primary_cta?: string;
  primary_cta_link?: string;
  secondary_cta?: string;
  secondary_cta_link?: string;
  hero_image?: string;
  /** When true and `hero_images` has 2+ entries, rotate through them instead of the single `hero_image`. */
  slider_enabled?: boolean;
  hero_images?: string[];
  stat_top_value?: string;
  stat_top_label?: string;
  stat_bottom_value?: string;
  stat_bottom_label?: string;
  instructors_count?: string;
  instructors_label?: string;
  avatars?: string[];
  search_placeholder?: string;
  category_placeholder?: string;
  search_link?: string;
};

type Props = { content?: HeroV2Content };

const DEFAULTS: HeroV2Content = {
  title_line1:          "Grow your skills,",
  title_line2:           "Build your future.",
  subtitle:              "We collaborate to ensure every student achieves academic, social, and emotional success by working together and providing comprehensive support.",
  primary_cta:           "Get Started",
  primary_cta_link:      "/courses",
  secondary_cta:         "Watch video",
  secondary_cta_link:    "/about",
  hero_image:            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=760&fit=crop",
  stat_top_value:        "23K",
  stat_top_label:        "Free Courses",
  stat_bottom_value:     "1023K",
  stat_bottom_label:     "Active Students",
  instructors_count:     "270+",
  instructors_label:     "Instructors",
  avatars: [
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b332906c?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  ],
  search_placeholder:    "Courses name ..",
  category_placeholder:  "All Categories",
  search_link:           "/courses",
};

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c0 6-2 8-8 8 6 0 8 2 8 8 0-6 2-8 8-8-6 0-8-2-8-8Z" />
    </svg>
  );
}

function DashedCircle({ className = "" }: { className?: string }) {
  return <span className={`pointer-events-none absolute rounded-full border border-dashed border-brand-900/15 ${className}`} />;
}

/** Cross-fades through `images` every 4s. Falls back to a single static image when there's nothing to rotate. */
function HeroImageSlider({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
    </>
  );
}

export function HeroV2({ content = {} }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<HeroV2Content>;
  const sliderImages = (content.hero_images ?? []).filter(Boolean);
  const heroImages = content.slider_enabled && sliderImages.length >= 2 ? sliderImages : [d.hero_image];

  return (
    <section className="relative overflow-hidden bg-brand-50 transition-colors duration-300 dark:bg-gray-900">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-0 h-full w-56 rounded-r-[50%] bg-brand-100/80 dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -left-40 -bottom-10 h-72 w-72 rounded-full bg-brand-200/50 blur-2xl dark:bg-brand-500/10" />

      {/* Scattered decoration */}
      <Sparkle className="pointer-events-none absolute left-[28%] top-16 h-4 w-4 text-brand-600/70" />
      <Sparkle className="pointer-events-none absolute right-[6%] top-14 h-3 w-3 text-brand-600/60" />
      <Sparkle className="pointer-events-none absolute left-[6%] top-1/2 h-3 w-3 text-brand-600/50" />
      <DashedCircle className="left-[16%] top-[22%] h-6 w-6" />
      <DashedCircle className="left-[42%] top-[10%] h-4 w-4" />
      <DashedCircle className="left-[38%] bottom-[8%] h-6 w-6" />

      <div className="container relative z-10 mx-auto grid grid-cols-1 gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        {/* ── Content ──────────────────────────────────────────────── */}
        <div className="relative flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-5xl">
            {d.title_line1}
            <br />
            <span className="relative inline-block text-brand-600 dark:text-brand-400">
              {d.title_line2}
              <svg
                viewBox="0 0 220 14"
                className="absolute -bottom-2 left-0 h-3 w-full text-brand-500 dark:text-brand-400"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 10c30-10 60-10 90 0s90 10 126-2"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="1 9"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-gray-600 dark:text-gray-400">{d.subtitle}</p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={d.primary_cta_link}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-600"
            >
              {d.primary_cta}
            </a>
            <a href={d.secondary_cta_link} className="group inline-flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm transition-transform group-hover:scale-105 dark:bg-gray-800 dark:text-brand-400">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
              {d.secondary_cta}
            </a>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex w-full max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-brand-900/5 dark:bg-gray-800">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder={d.search_placeholder}
                className="w-full bg-transparent py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
            <div className="hidden items-center gap-1 border-l border-gray-200 px-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:flex">
              {d.category_placeholder}
            </div>
            <a
              href={d.search_link}
              className="shrink-0 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Search
            </a>
          </div>
        </div>

        {/* ── Right image + floating cards ─────────────────────────── */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="pointer-events-none absolute -right-8 -top-8 h-72 w-72 rounded-full bg-brand-400/30 blur-2xl dark:bg-brand-500/10" />

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[42%_58%_63%_37%/48%_40%_60%_52%] shadow-xl">
            <HeroImageSlider images={heroImages} />

            {/* Floating icon badge */}
            <span className="absolute left-[10%] top-[14%] flex h-11 w-11 -rotate-12 items-center justify-center rounded-2xl bg-white/90 text-brand-600 shadow-lg">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>

          {/* Floating stat — top right */}
          <div className="absolute right-0 top-8 flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-lg shadow-brand-900/10 dark:bg-gray-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <CountUpNumber value={d.stat_top_value} className="text-sm font-bold text-brand-600 dark:text-brand-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{d.stat_top_label}</p>
            </div>
          </div>

          {/* Floating stat — bottom left */}
          <div className="absolute -left-4 bottom-24 flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-lg shadow-brand-900/10 dark:bg-gray-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Users className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <CountUpNumber value={d.stat_bottom_value} className="text-sm font-bold text-brand-600 dark:text-brand-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{d.stat_bottom_label}</p>
            </div>
          </div>

          {/* Instructors pill — bottom center */}
          <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 py-2 pl-2 pr-4 text-white shadow-lg">
            <div className="flex -space-x-2.5">
              {d.avatars.slice(0, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-7 w-7 rounded-full border-2 border-gray-900 object-cover"
                />
              ))}
            </div>
            <span className="text-xs font-semibold">
              {d.instructors_count} {d.instructors_label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroV2;
