"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";

function toBengaliNumber(n: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return n.toLocaleString("en-US").replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)] || d);
}

export interface MasteryStickyOfferBarProps {
  logo?: ReactNode;
  ctaButton?: ReactNode;
  price: number;
  discountPrice: number | null;
  timerHours?: string;
  timerMinutes?: string;
  timerSeconds?: string;
  offerLabel?: string;
  overrides?: Record<string, { backgroundColor?: string; color?: string }>;
}

function pad(n: number) {
  return toBengaliNumber(n).padStart(2, "০");
}

export function MasteryStickyOfferBar({
  logo,
  ctaButton,
  price,
  discountPrice,
  timerHours,
  timerMinutes,
  timerSeconds,
  offerLabel,
  overrides,
}: MasteryStickyOfferBarProps) {
  const [hours, setHours] = useState(Number(timerHours) || 20);
  const [minutes, setMinutes] = useState(Number(timerMinutes) || 7);
  const [seconds, setSeconds] = useState(Number(timerSeconds) || 12);

  useEffect(() => {
    if (timerHours !== undefined) setHours(Number(timerHours) || 0);
    if (timerMinutes !== undefined) setMinutes(Number(timerMinutes) || 0);
    if (timerSeconds !== undefined) setSeconds(Number(timerSeconds) || 0);
  }, [timerHours, timerMinutes, timerSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 0) return prev - 1;
        setMinutes((pm) => {
          if (pm > 0) return pm - 1;
          setHours((ph) => (ph > 0 ? ph - 1 : 0));
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const finalPrice = discountPrice ?? price;
  const hasDiscount = discountPrice !== null && discountPrice < price;
  const discountPct = hasDiscount ? Math.round(((price - finalPrice) / price) * 100) : 0;

  const sanitize = (c?: string) => c && c.trim() !== "-" && c.trim() !== "#" && c.trim() !== "" ? c.trim() : undefined;
  const outerBg = sanitize(overrides?.topbarOuter?.backgroundColor) ?? sanitize((overrides as any)?.["[data-topbar]"]?.backgroundColor);
  const outerColor = sanitize(overrides?.topbarOuter?.color) ?? sanitize((overrides as any)?.["[data-topbar]"]?.color);
  const cBoxBg = sanitize(overrides?.topbarCountdownBox?.backgroundColor);
  const cText = sanitize(overrides?.topbarCountdownText?.color);
  const oCardBg = sanitize(overrides?.topbarOfferCard?.backgroundColor);
  const oText = sanitize(overrides?.topbarOfferText?.color);
  const eBg = sanitize(overrides?.topbarEnroll?.backgroundColor);
  const eColor = sanitize(overrides?.topbarEnroll?.color);

  const overrideCss = [
    outerBg ? `[data-topbar]{background-color:${outerBg} !important;background-image:none !important;}` : "",
    outerColor ? `[data-topbar]{color:${outerColor} !important;}[data-topbar-label]{color:${outerColor} !important;}` : "",
    cBoxBg ? `[data-topbar-countdown-box]{background-color:${cBoxBg} !important;background-image:none !important;}` : "",
    cText ? `[data-topbar-countdown-text]{color:${cText} !important;}` : "",
    oCardBg ? `[data-topbar-offer-card]{background-color:${oCardBg} !important;background-image:none !important;}` : "",
    oText ? `[data-topbar-offer-text]{color:${oText} !important;}` : "",
    eBg ? `[data-topbar-enroll], [data-topbar-enroll] button, [data-topbar-enroll] a, [data-topbar-enroll] span{background:${eBg} !important;background-color:${eBg} !important;background-image:none !important;}` : "",
    eColor ? `[data-topbar-enroll], [data-topbar-enroll] button, [data-topbar-enroll] a, [data-topbar-enroll] span, [data-topbar-enroll] *{color:${eColor} !important;}` : "",
  ].filter(Boolean).join("\n");

  return (
    <div
      data-topbar=""
      className="border-b border-[#a7f3d0] bg-[#ecfdf5] shadow-[0_2px_16px_rgba(0,0,0,0.1)]"
      style={{
        fontFamily: '"Hind Siliguri", sans-serif',
        backgroundColor: outerBg,
        color: outerColor,
      }}
    >
      <style>{`
        @keyframes pulse-text {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        ${overrideCss}
      `}</style>
      {/*
        KEY FIX: justify-start on mobile (tight, content-hugging gaps),
        sm:justify-between restores the original desktop spread — desktop is untouched.
      */}
      <div className="max-w-[1714px] mx-auto px-1 sm:px-4 h-[60px] sm:h-[71px] flex flex-nowrap items-center justify-start sm:justify-between gap-1 sm:gap-4 overflow-hidden">

        {/* LEFT: Logo — scaled down on mobile only */}
        <div className="shrink-0 scale-[0.75] w-[100px] origin-left sm:scale-100 sm:w-auto">
          {logo}
        </div>

        {/* MIDDLE: Countdown Timer */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <span data-topbar-label="" className="text-[#064e3b] font-bold text-[11px] sm:text-[14px] whitespace-nowrap hidden sm:inline" style={{ color: outerColor }}>
            {offerLabel || "অফার শেষ হতে:"}
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <div className="flex flex-col items-center">
              <div data-topbar-countdown-box="" style={{ backgroundColor: cBoxBg }} className="bg-[#064e3b] text-white border border-gray-200 rounded-md min-w-[28px] sm:min-w-[40px] h-[28px] sm:h-[40px] py-0.5 sm:py-1 px-1 sm:px-2 flex flex-col items-center justify-center">
                <span data-topbar-countdown-text="" style={{ color: cText }} className="text-white text-[10px] sm:text-[15px] font-bold tabular-nums leading-none">{pad(hours)}</span>
                <small data-topbar-countdown-text="" style={{ color: cText }} className="text-[7px] sm:text-[10px]">h</small>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div data-topbar-countdown-box="" style={{ backgroundColor: cBoxBg }} className="bg-[#064e3b] text-white border border-gray-200 rounded-md min-w-[26px] sm:min-w-[40px] h-[28px] sm:h-[40px] py-0.5 sm:py-1 px-0.5 sm:px-2 flex flex-col items-center justify-center">
                <span data-topbar-countdown-text="" style={{ color: cText }} className="text-white text-[10px] sm:text-[15px] font-bold tabular-nums leading-none">{pad(minutes)}</span>
                <small data-topbar-countdown-text="" style={{ color: cText }} className="text-[7px] sm:text-[10px]">m</small>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div data-topbar-countdown-box="" style={{ backgroundColor: cBoxBg }} className="bg-[#064e3b] text-white border border-gray-200 rounded-md min-w-[26px] sm:min-w-[40px] h-[28px] sm:h-[40px] py-0.5 sm:py-1 px-0.5 sm:px-2 flex flex-col items-center justify-center">
                <span data-topbar-countdown-text="" style={{ color: cText }} className="text-white text-[10px] sm:text-[15px] font-bold tabular-nums leading-none">{pad(seconds)}</span>
                <small data-topbar-countdown-text="" style={{ color: cText }} className="text-[7px] sm:text-[10px]">s</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Price Card + Enroll button */}
        <div className="flex items-center gap-0.5 sm:gap-4 shrink-0 h-[42px] sm:h-[51px]">
          {/* Price Card — smaller box + smaller font on mobile only */}
          <div
            data-topbar-offer-card=""
            style={{ backgroundColor: oCardBg }}
            className="relative flex flex-col items-center justify-center border border-[#059669] bg-[#d1fae5] rounded-lg w-[52px] h-[28px] px-0.5 shrink-0 sm:w-[134px] sm:h-[51px] sm:px-0"
          >
            {hasDiscount && (
              <span className="absolute -top-1.5 sm:-top-2.5 left-1/2 -translate-x-1/2 bg-[#facc15] text-[#422006] text-[6px] sm:text-[11px] font-bold sm:font-bold px-1 sm:px-2 py-0.5 rounded-full border border-yellow-300 whitespace-nowrap shadow-sm">
                {toBengaliNumber(discountPct)}% ছাড়
              </span>
            )}
            {hasDiscount && (
              <span className="text-red-400 text-[7px] sm:text-[12px] line-through mt-[6px] sm:mt-[6px] font-bold">
                ৳{toBengaliNumber(price)}
              </span>
            )}
            <span
              data-topbar-offer-text=""
              className="text-[#065f46] font-extrabold leading-tight text-[8px] sm:text-[18px]"
              style={{
                fontWeight: 800,
                lineHeight: 1.1,
                display: "block",
                animation: "pulse-text 1.4s ease-in-out infinite",
                color: oText,
              }}
            >
              ৳{toBengaliNumber(finalPrice)} মাত্র
            </span>
          </div>

          {/* Enroll button — smaller on mobile only */}
          <div data-topbar-enroll="" className="scale-[0.62] origin-right sm:scale-100 shrink-0">
            {ctaButton && React.isValidElement(ctaButton)
              ? React.cloneElement(ctaButton as React.ReactElement<any>, {
                  style: {
                    ...((ctaButton as any).props?.style ?? {}),
                    ...(eBg ? { backgroundColor: eBg, background: eBg } : {}),
                    ...(eColor ? { color: eColor } : {}),
                  },
                } as any)
              : ctaButton}
          </div>
        </div>

      </div>
    </div>
  );
}