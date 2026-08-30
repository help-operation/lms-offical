/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Star, User, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CourseReview } from "@/features/courses/api";
import { useAutoplay } from "@/shared/hooks/useAutoplay";

// ─── Video URL helpers ────────────────────────────────────────────────────────

export function youtubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

export function vimeoVideoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

export function autoThumbnail(videoUrl: string): string | null {
  const ytId = youtubeVideoId(videoUrl);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function StarRow({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700"}`} />
        ))}
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 w-6 text-right dark:text-gray-500">{pct}%</span>
    </div>
  );
}

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700"}`} />
      ))}
    </div>
  );
}

export function resolveReviewer(r: CourseReview) {
  if (r.source === "admin_curated") {
    return { name: r.displayName ?? "Anonymous", role: r.displayRole ?? null, avatar: r.displayAvatar ?? null };
  }
  const first = r.userFirstName ?? "";
  const last  = r.userLastName  ?? "";
  return { name: `${first} ${last}`.trim() || "Anonymous student", role: "Student", avatar: r.userAvatar ?? null };
}

export function SmallAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
  }
  const initials = name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials || <User size={12} />}
    </div>
  );
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Read-more modal ──────────────────────────────────────────────────────────

function ReadMoreModal({
  review, name, role, avatar, onClose,
}: { review: CourseReview; name: string; role: string | null; avatar: string | null; onClose: () => void }) {
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 max-h-[80vh] overflow-y-auto dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors dark:text-gray-500 dark:hover:bg-gray-800"
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <SmallAvatar name={name} avatar={avatar} />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
            {role && <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>}
          </div>
        </div>

        <StarDisplay rating={review.rating} />

        <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:text-gray-300">
          {review.comment}
        </p>

        {review.createdAt && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">{fmtDate(review.createdAt)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Text review card ─────────────────────────────────────────────────────────

const CLIP_CHARS = 160;

function TextReviewCard({ review }: { review: CourseReview }) {
  const [readMore, setReadMore] = useState(false);
  const { name, role, avatar } = resolveReviewer(review);
  const text   = review.comment ?? "";
  const isLong = text.length > CLIP_CHARS;

  return (
    <>
      <div className="shrink-0 w-[280px] rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-2.5 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        {/* Reviewer */}
        <div className="flex items-center gap-2.5">
          <SmallAvatar name={name} avatar={avatar} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate dark:text-white">{name}</p>
            {role && <p className="text-xs text-gray-500 truncate dark:text-gray-400">{role}</p>}
          </div>
        </div>

        {/* Stars */}
        <StarDisplay rating={review.rating} />

        {/* Comment */}
        {text && (
          <p className="text-sm text-gray-600 leading-relaxed flex-1 line-clamp-4 dark:text-gray-300">
            {text}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {isLong ? (
            <button
              onClick={() => setReadMore(true)}
              className="text-xs text-brand-600 font-medium hover:underline dark:text-brand-400"
            >
              Read more
            </button>
          ) : <span />}
          {review.createdAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(review.createdAt)}</p>
          )}
        </div>
      </div>

      {readMore && (
        <ReadMoreModal
          review={review}
          name={name}
          role={role}
          avatar={avatar}
          onClose={() => setReadMore(false)}
        />
      )}
    </>
  );
}

// ─── Video review card ────────────────────────────────────────────────────────

function VideoReviewCard({ review }: { review: CourseReview }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { name, role, avatar } = resolveReviewer(review);
  const thumb = review.videoThumbnail || (review.videoUrl ? autoThumbnail(review.videoUrl) : null);

  return (
    <>
      <div className="shrink-0 w-[280px] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        {/* Thumbnail + play */}
        <div
          className="relative aspect-video overflow-hidden rounded-xl bg-gray-900 cursor-pointer"
          onClick={() => review.videoUrl && setModalOpen(true)}
        >
          {thumb ? (
            <img src={thumb} alt={name} className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-800 to-brand-600" />
          )}
          <button
            aria-label={`Play ${name}'s video review`}
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 ring-4 ring-white/40 backdrop-blur-sm transition-transform hover:scale-110"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <Play className="h-4 w-4 fill-brand-600 text-brand-600" />
            </span>
          </button>
          <div className="absolute bottom-2 right-2">
            <StarDisplay rating={review.rating} />
          </div>
        </div>

        {/* Reviewer info */}
        <div className="mt-3 flex items-center gap-3 px-1 pb-1">
          {avatar ? (
            <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shrink-0 dark:bg-brand-500/15 dark:text-brand-400">
              {name[0] ?? <User size={14} />}
            </span>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900 truncate dark:text-white">{name}</p>
            {role && <p className="text-xs text-gray-500 truncate dark:text-gray-400">{role}</p>}
          </div>
        </div>
      </div>

      {modalOpen && review.videoUrl && (
        <VideoModal
          url={review.videoUrl}
          title={`${name}'s video review`}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ─── Video modal ──────────────────────────────────────────────────────────────

function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const ytId  = youtubeVideoId(url);
  const vmId  = vimeoVideoId(url);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={close}
    >
      <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={close}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
          aria-label="Close"
        >
          <X size={18} /> Close
        </button>

        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              className="h-full w-full"
              title={title}
            />
          ) : vmId ? (
            <iframe
              src={`https://player.vimeo.com/video/${vmId}?autoplay=1`}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="h-full w-full"
              title={title}
            />
          ) : (
            <video src={url} controls autoPlay className="h-full w-full" title={title} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Unified reviews slider ───────────────────────────────────────────────────

export function ReviewsSlider({ reviews }: { reviews: CourseReview[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const n = reviews.length;
  // Rendered twice back-to-back so autoplay/next can keep scrolling forward
  // forever — once it drifts into the duplicated half we silently snap back
  // to the equivalent real position (see effect below), so it never visibly
  // reverses direction.
  const loopReviews = n > 3 ? [...reviews, ...reviews] : reviews;

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || n <= 3) return;
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollTo({ left: el.scrollLeft - half, behavior: "instant" });
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(settleTimer);
    };
  }, [n]);

  useAutoplay(() => scrollBy(1), 4000, !paused && n > 3);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {reviews.length > 3 && (
        <>
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-600 hover:text-white transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-md hover:bg-brand-600 hover:text-white transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loopReviews.map((r, i) => {
          const key = i < n ? r.id : `clone-${r.id}`;
          return r.reviewType === "video"
            ? <VideoReviewCard key={key} review={r} />
            : <TextReviewCard  key={key} review={r} />;
        })}
      </div>
    </div>
  );
}
