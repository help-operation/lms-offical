"use client";

import { useEffect, useState } from "react";

export interface LiveCoursePromoBarProps {
  logoUrl: string;
  logoAlt: string;
  price: string;
  originalPrice?: string | null;
  countdownEnd?: string | null;
  /** Template's accent color as a hex string (e.g. "#7C3AED"). Defaults to the site's brand purple. */
  accentColor?: string;
  /** Text color used on top of solid accent-colored elements (countdown boxes, Enroll button). Defaults to white. */
  accentTextColor?: string;
}

function useCountdown(target?: string | null) {
  const [left, setLeft] = useState<{ h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function TimeBox({ value, label, bg, fg }: { value: number; label: string; bg: string; fg: string }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none sm:h-9 sm:w-9 sm:text-xs"
      style={{ backgroundColor: bg, color: fg }}
    >
      {String(value).padStart(2, "0")}
      <span className="mt-0.5 hidden text-[9px] font-medium uppercase opacity-80 sm:inline">{label}</span>
    </span>
  );
}

/** Sticky promo bar shown in place of the site's main header on live-course
 * landing pages (all 5 templates) — logo, live countdown, discounted price,
 * and an Enroll button that jumps to the on-page enrollment form
 * (`LiveEnrollmentForm` renders `<section id="enroll">` in every template).
 * Colored to match whichever template it's mounted in via `accentColor`. */
export function LiveCoursePromoBar({
  logoUrl,
  logoAlt,
  price,
  originalPrice,
  countdownEnd,
  accentColor = "#a64dff",
  accentTextColor = "#ffffff",
}: LiveCoursePromoBarProps) {
  const countdown = useCountdown(countdownEnd);

  const priceNum = parseFloat(price);
  const originalNum = originalPrice ? parseFloat(originalPrice) : null;
  const hasDiscount = originalNum !== null && !Number.isNaN(originalNum) && originalNum > priceNum;
  const discountPct = hasDiscount ? Math.round(((originalNum! - priceNum) / originalNum!) * 100) : null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{ backgroundColor: `${accentColor}14`, borderColor: `${accentColor}33` }}
    >
      <div className="container mx-auto flex flex-col gap-2 px-3 py-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3 sm:px-4 sm:py-2.5">
        {/* Row 1 (mobile): Logo + Countdown, centered via a 3-col grid so the
            countdown sits at the true midpoint regardless of logo width */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:contents">
          {/* Logo */}
          <a href="/" className="flex min-w-0 shrink-0 items-center gap-2 justify-self-start" aria-label={logoAlt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={logoAlt} className="h-7 w-auto object-contain sm:h-9" />
          </a>

          {/* Countdown */}
          {countdown && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 justify-self-center">
              <span className="hidden sm:inline">অফার শেষ হতে:</span>
              <div className="flex items-center gap-1">
                <TimeBox value={countdown.h} label="H" bg={accentColor} fg={accentTextColor} />
                <TimeBox value={countdown.m} label="M" bg={accentColor} fg={accentTextColor} />
                <TimeBox value={countdown.s} label="S" bg={accentColor} fg={accentTextColor} />
              </div>
            </div>
          )}

          {/* Spacer to balance the logo column so the countdown centers on the full row width */}
          <span className="sm:hidden" aria-hidden="true" />
        </div>

        {/* Row 2 (mobile): Price + CTA */}
        <div className="flex items-center justify-center gap-1.5 sm:contents">
          <div className="flex min-w-0 items-center gap-1.5 sm:justify-self-end sm:gap-3">
            {hasDiscount && (
              <span className="inline-block shrink-0 whitespace-nowrap rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 sm:px-2 sm:py-1 sm:text-xs">
                <span className="sm:hidden">-{discountPct}%</span>
                <span className="hidden sm:inline">{discountPct}% ছাড়</span>
              </span>
            )}
            <div
              className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 sm:px-3 sm:py-1.5"
              style={{ borderColor: `${accentColor}40` }}
            >
              {hasDiscount && (
                <span className="text-[10px] text-gray-400 line-through dark:text-gray-500 sm:text-xs">৳{originalNum!.toLocaleString()}</span>
              )}
              <span className="text-xs font-bold sm:text-sm" style={{ color: accentColor }}>
                ৳{priceNum.toLocaleString()}
                <span className="hidden sm:inline"> Only</span>
              </span>
            </div>
            <a
              href="#enroll"
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 sm:px-5 sm:py-2 sm:text-sm"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              Enroll
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
