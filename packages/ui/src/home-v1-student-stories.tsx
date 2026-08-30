"use client";

import { GraduationCap, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type StudentStoriesContent = {
  eyebrow?: string;
  title_prefix?: string;
  title_highlight?: string;
  subtitle?: string;
  limit?: number;
};

export type StudentStoryItem = {
  id: string | number;
  displayAvatar?: string | null;
  displayName?: string | null;
  rating: number;
  comment?: string | null;
  displayRole?: string | null;
};

type Props = {
  content?: StudentStoriesContent;
  reviews: StudentStoryItem[];
};

const DEFAULTS: Required<StudentStoriesContent> = {
  eyebrow: "Our Students' Stories",
  title_prefix: "Stories of",
  title_highlight: "Our Successful Students",
  subtitle: "See what learners say after finishing their courses with us.",
  limit: 8,
};

const AUTOPLAY_INTERVAL_MS = 3500;

function StoryCard({ r }: { r: StudentStoryItem }) {
  return (
    <div className="flex h-full shrink-0 basis-full gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800 sm:basis-1/2 lg:basis-1/4">
      <div className="relative shrink-0">
        {r.displayAvatar ? (
          <img src={r.displayAvatar} alt={r.displayName ?? ""} className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {(r.displayName ?? "?").charAt(0)}
          </div>
        )}
        <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-white dark:ring-gray-800">
          <GraduationCap className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"}`} />
          ))}
        </div>
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{r.comment}</p>
        <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{r.displayName}</p>
        {r.displayRole && <p className="text-xs text-gray-500 dark:text-gray-400">{r.displayRole}</p>}
      </div>
    </div>
  );
}

export function StudentStoriesV2({ content = {}, reviews }: Props) {
  const d = { ...DEFAULTS, ...content } as Required<StudentStoriesContent>;
  const shown = reviews.slice(0, d.limit);
  const n = shown.length;
  // Rendered twice back-to-back so autoplay can keep scrolling forward
  // forever — once it drifts into the duplicated half we silently rebase
  // back to the equivalent real position, so it never visibly reverses.
  const loopShown = n > 1 ? [...shown, ...shown] : shown;

  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const cardStep = () => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 24 : 0;
  };

  const goTo = (i: number) => {
    trackRef.current?.scrollTo({ left: i * cardStep(), behavior: "smooth" });
    setActive(i);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setActive(Math.round(el.scrollLeft / cardStep()) % Math.max(1, n));
      if (n <= 1) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollTo({ left: el.scrollLeft - half, behavior: "instant" });
      }, 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(settleTimer);
    };
  }, [n]);

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = setInterval(() => {
      trackRef.current?.scrollBy({ left: cardStep(), behavior: "smooth" });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [n, paused]);

  if (shown.length === 0) return null;

  return (
    <section
      className="bg-brand-50/60 py-16 transition-colors duration-300 dark:bg-gray-800 lg:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {d.title_prefix} <span className="text-brand-600 dark:text-brand-400">{d.title_highlight}</span>
          </h2>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{d.subtitle}</p>
        </div>

        <div className="relative mt-10">
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {loopShown.map((r, i) => (
              <StoryCard key={i < n ? r.id : `clone-${r.id}`} r={r} />
            ))}
          </div>

          {shown.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {shown.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 cursor-pointer rounded-full transition-all ${
                    active === i ? "w-6 bg-brand-600 dark:bg-brand-400" : "w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default StudentStoriesV2;
