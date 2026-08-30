"use client";

import React, { type ReactNode } from "react";

function toBengaliNumber(n: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return n.toLocaleString("en-US").replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)] || d);
}

export interface MasteryBottomBarProps {
  phone?: string | null;
  price: number;
  discountPrice: number | null;
  ctaButtons?: ReactNode;
  /** When false, uses sticky instead of fixed — for admin preview. */
  fixed?: boolean;
  overrides?: Record<string, { backgroundColor?: string; color?: string; borderColor?: string; text?: string }>;
  promoText?: string | null;
}

export function MasteryBottomBar({
  phone,
  price,
  discountPrice,
  ctaButtons,
  fixed = true,
  overrides,
  promoText,
}: MasteryBottomBarProps) {
  const finalPrice = discountPrice ?? price;
  const hasDiscount = discountPrice !== null && discountPrice < price;

  const sanitize = (c?: string) => c && c.trim() !== "-" && c.trim() !== "#" && c.trim() !== "" ? c.trim() : undefined;
  const outerBg = sanitize((overrides as any)?.bottombarOuter?.backgroundColor) ?? sanitize((overrides as any)?.["[data-bottombar]"]?.backgroundColor);
  const outerBorder = sanitize((overrides as any)?.bottombarOuter?.borderColor);
  const phoneColor = sanitize((overrides as any)?.bottombarPhone?.color);
  const priceColor = sanitize((overrides as any)?.bottombarPrice?.color);
  const discountColor = sanitize((overrides as any)?.bottombarDiscount?.color);
  const promoColor = sanitize((overrides as any)?.bottombarPromo?.color);
  const promoCheck = sanitize((overrides as any)?.bottombarPromo?.backgroundColor); // check icon stroke
  const promoLabel = sanitize((overrides as any)?.bottombarPromo?.text) ?? sanitize(promoText ?? undefined) ?? "প্রোমো অফারে";
  const enrollBg = sanitize((overrides as any)?.bottombarEnroll?.backgroundColor);
  const enrollColor = sanitize((overrides as any)?.bottombarEnroll?.color);

  const overrideCss = [
    outerBg ? `[data-bottombar]{background:${outerBg} !important;background-color:${outerBg} !important;background-image:none !important;}` : "",
    outerBorder ? `[data-bottombar]{border-top-color:${outerBorder} !important;}` : "",
    phoneColor ? `[data-bottombar-phone]{color:${phoneColor} !important;}` : "",
    priceColor ? `[data-bottombar-price]{color:${priceColor} !important;}` : "",
    discountColor ? `[data-bottombar-discount]{color:${discountColor} !important;}` : "",
    promoColor ? `[data-bottombar-promo]{color:${promoColor} !important;}` : "",
    promoCheck ? `[data-bottombar-promo-check]{stroke:${promoCheck} !important;}` : "",
    enrollBg ? `[data-bottombar-enroll], [data-bottombar-enroll] button, [data-bottombar-enroll] a, [data-bottombar-enroll] span{background:${enrollBg} !important;background-color:${enrollBg} !important;background-image:none !important;}` : "",
    enrollColor ? `[data-bottombar-enroll], [data-bottombar-enroll] button, [data-bottombar-enroll] a, [data-bottombar-enroll] span, [data-bottombar-enroll] *{color:${enrollColor} !important;}` : "",
  ].filter(Boolean).join("\n");

  return (
    <div
      data-bottombar=""
      className={`${fixed ? "fixed bottom-0 left-0 right-0" : "relative w-full"} z-[998]`}
      style={{
        fontFamily: '"Hind Siliguri", sans-serif',
        borderTop: `1px solid ${outerBorder ?? "#a7f3d0"}`,
        background: outerBg ?? "#ecfdf5",
      }}
    >
      <style>{overrideCss ? `${overrideCss}` : ""}</style>
      <div className="mx-auto flex flex-col sm:flex-row sm:h-[93px] max-w-[1440px] sm:items-center sm:justify-between px-3 sm:px-4 py-2 sm:py-0 gap-2 sm:gap-4 text-center sm:text-left">
        {/* LEFT: Phone + Prices */}
        <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 min-w-0">
          {phone && (
            <div
              data-bottombar-phone=""
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 whitespace-nowrap text-[15px] sm:text-[25px] font-semibold text-black"
              style={{ color: phoneColor || undefined }}
            >
              <span>📞 কল করুন এই নাম্বারেঃ</span>
              {phone}
            </div>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span data-bottombar-price="" className="text-[14px] sm:text-[26px] font-bold text-black" style={{ color: priceColor || undefined }}>
              ৳{toBengaliNumber(finalPrice)}
            </span>
            {hasDiscount && (
              <span data-bottombar-discount="" className="text-[14px] sm:text-[26px] font-bold text-[#FE0000] line-through" style={{ color: discountColor || undefined }}>
                ৳{toBengaliNumber(price)}
              </span>
            )}
            <span data-bottombar-promo="" className="text-[11px] sm:text-[15px] font-bold text-black flex items-center gap-1" style={{ color: promoColor || undefined }}>
              <svg data-bottombar-promo-check="" className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={promoCheck ?? "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{promoLabel}</span>
            </span>
          </div>
        </div>

        {/* RIGHT: CTA buttons */}
        {ctaButtons && (
          <div data-bottombar-enroll="" className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            {React.isValidElement(ctaButtons)
              ? React.cloneElement(ctaButtons as React.ReactElement<any>, {
                  style: {
                    ...((ctaButtons as any).props?.style ?? {}),
                    ...(enrollBg ? { backgroundColor: enrollBg, background: enrollBg } : {}),
                    ...(enrollColor ? { color: enrollColor } : {}),
                  },
                } as any)
              : ctaButtons}
          </div>
        )}
      </div>
    </div>
  );
}
