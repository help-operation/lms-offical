"use client";

import { Star, User, BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LandingReview } from "@/features/landing/types";
import { useAutoplay } from "@/shared/hooks/useAutoplay";

const ReviewCard = ({ r, active }: { r: LandingReview; active: boolean }) => (
  <div
    className={`snap-start shrink-0 w-[320px] md:w-[400px] self-start rounded-2xl bg-white dark:bg-gray-800 p-6 transition-all duration-300 ${
      active
        ? "border-2 border-brand-500 opacity-100 scale-100 shadow-2xl z-10"
        : "border border-gray-100 dark:border-gray-700 opacity-30 scale-[0.9]"
    }`}
  >
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 ring-2 ring-brand-300">
        <User className="h-6 w-6" />
      </span>
      <div>
        <div className="flex items-center gap-1">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-brand-300 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <BadgeCheck className="h-3.5 w-3.5" />
          Batch - {r.batch}
        </span>
        <h4 className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">{r.name}</h4>
      </div>
    </div>

    <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{r.text}</p>
  </div>
);

export function StudentReviewsCarousel({ reviews }: { reviews: LandingReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, scrollLeft: 0 });
  const n = reviews.length;
  // Rendered twice back-to-back so autoplay/goTo can keep moving forward —
  // once the scroll settles past the duplicated half we silently rebase
  // back to the equivalent real card, so it never visibly reverses.
  const loopReviews = n > 1 ? [...reviews, ...reviews] : reviews;

  const cardStep = () => {
    const el = trackRef.current;
    if (!el) return 444;
    const cards = el.querySelectorAll("[data-card]");
    const first = cards[0] as HTMLElement | undefined;
    const second = cards[1] as HTMLElement | undefined;
    if (first && second) return second.offsetLeft - first.offsetLeft;
    return first ? first.offsetWidth + 24 : 444;
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    const target = cards[i];
    setActive(i);
    if (target) {
      el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: "smooth" });
    } else {
      el.scrollTo({ left: i * cardStep(), behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setActive(
        Math.min(
          loopReviews.length - 1,
          Math.max(0, Math.round(el.scrollLeft / cardStep())),
        ),
      );
      if (n <= 1) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const cards = el.querySelectorAll<HTMLElement>("[data-card]");
        const first = cards[0];
        const boundary = cards[n];
        if (first && boundary && el.scrollLeft >= boundary.offsetLeft - el.offsetLeft - 5) {
          el.scrollTo({ left: el.scrollLeft - (boundary.offsetLeft - first.offsetLeft), behavior: "instant" });
          setActive((a) => Math.max(0, a - n));
        }
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(settleTimer);
    };
  }, [n, loopReviews.length]);

  useAutoplay(
    () => goTo((active + 1) % loopReviews.length),
    4500,
    !paused && n > 1,
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Recurring ring + dot accent */}
      <span className="absolute -top-6 left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-800 ring-2 ring-brand-300">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory items-start gap-6 overflow-x-auto scroll-smooth px-2 py-8 pr-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          const el = trackRef.current;
          if (!el) return;
          dragRef.current = { dragging: true, moved: false, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
        }}
        onMouseMove={(e) => {
          const el = trackRef.current;
          if (!el || !dragRef.current.dragging) return;
          e.preventDefault();
          dragRef.current.moved = true;
          el.scrollLeft = dragRef.current.scrollLeft - (e.pageX - el.offsetLeft - dragRef.current.startX);
        }}
        onMouseUp={() => { dragRef.current.dragging = false; }}
        onMouseLeave={() => { dragRef.current.dragging = false; }}
      >
        {loopReviews.map((r, i) => (
          <div
            key={i < n ? r.id : `clone-${r.id}`}
            data-card
            className="shrink-0 cursor-pointer"
            onClick={() => { if (!dragRef.current.moved) goTo(i); }}
          >
            <ReviewCard r={r} active={i === active} />
          </div>
        ))}
        {/* Trailing spacer so the last cards can scroll into the left focus slot */}
        <div aria-hidden className="shrink-0 w-[85%] md:w-[70%]" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to review ${i + 1}`}
            className={`h-2 cursor-pointer rounded-full transition-all ${
              active % n === i ? "w-8 bg-brand-600" : "w-6 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
