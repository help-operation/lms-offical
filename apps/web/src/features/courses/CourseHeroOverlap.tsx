"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// How much of the purchase card should sit inside the hero on desktop, at most.
const TARGET_OVERLAP = 306;
// Always leave at least this much hero visible above the card, so a short
// hero (short title, no description) never lets the card poke out the top.
const SAFE_MARGIN = 32;

/**
 * Wraps the hero + body grid so the purchase card's overlap into the hero is
 * clamped to the hero's actual rendered height instead of a fixed pixel
 * guess. The hero's own height stays fully content-driven (see CourseHero);
 * this only prevents the card from overlapping more than the hero can fit.
 */
export function CourseHeroOverlap({
  hero,
  sidebar,
  children,
}: {
  hero: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [overlap, setOverlap] = useState(TARGET_OVERLAP);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const measure = () => {
      const heroHeight = el.getBoundingClientRect().height;
      setOverlap(Math.max(0, Math.min(TARGET_OVERLAP, heroHeight - SAFE_MARGIN)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={heroRef}>{hero}</div>

      {/* Body grid with overlapping sticky sidebar */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sticky purchase card — pulled up into the hero, clamped to fit */}
          <div className="order-first lg:order-last lg:col-span-1">
            <div
              className="mx-auto w-full max-w-[400px] lg:sticky lg:top-24 lg:ml-auto lg:[margin-top:var(--card-overlap)]"
              style={{ "--card-overlap": `-${overlap}px` } as React.CSSProperties}
            >
              {sidebar}
            </div>
          </div>

          {/* Main column */}
          {children}
        </div>
      </div>
    </>
  );
}
