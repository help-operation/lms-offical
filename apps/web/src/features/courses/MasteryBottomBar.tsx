"use client";

import { useEffect, useRef, useState } from "react";
import { MasteryBottomBar as MasteryBottomBarCore } from "@repo/ui/mastery-bottom-bar";

interface Props {
  courseSlug: string;
  price: number;
  discountPrice: number | null;
  phone?: string | null;
  ctaText?: string;
  overrides?: Record<string, { backgroundColor?: string; color?: string; borderColor?: string; text?: string }>;
  promoText?: string | null;
}

export function MasteryBottomBar({
  courseSlug,
  price,
  discountPrice,
  phone,
  ctaText = "বাচ ভর্তি হোন",
  overrides,
  promoText,
}: Props) {
  function scrollToEnroll() {
    const el = document.getElementById("enroll");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(true);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          // At original place → static (not sticky)
          setIsSticky(false);
        } else {
          // Not visible → check if below viewport (not yet reached) vs above (scrolled past)
          const isBelow = entry.boundingClientRect.top > 0;
          setIsSticky(isBelow); // sticky only when below (at top), not when above (scrolled past down)
        }
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <MasteryBottomBarCore
        fixed={isSticky}
        phone={phone}
        price={price}
        discountPrice={discountPrice}
        overrides={overrides}
        promoText={promoText ?? (overrides as any)?.bottombarPromo?.text ?? null}
        ctaButtons={
          <button
            type="button"
            onClick={scrollToEnroll}
            style={{
              fontFamily: '"Hind Siliguri", sans-serif',
              fontWeight: 500,
              color: "#FFFFFF",
              backgroundColor: "#1E4600",
              borderRadius: 8,
            }}
            className="h-[39px] px-4 sm:px-6 w-full sm:w-[367px] text-[15px] sm:text-[15px] transition-colors whitespace-nowrap shadow-md cursor-pointer hover:opacity-90"
          >
            {ctaText}
          </button>
        }
      />
    </>
  );
}
