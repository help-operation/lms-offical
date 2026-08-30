"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type NavItem = { id: string; label: string };

export function CourseSectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  // Measured height of the sticky site header. Fallback ~92px (desktop) until
  // the real value is read on mount, so the tabs pin flush beneath the header
  // with no gap, sliver, or overlap — at any breakpoint.
  const [headerH, setHeaderH] = useState(92);
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [items]);

  const scrollTabs = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setHeaderH(header.getBoundingClientRect().height);
    measure();
    // Re-measure when the header resizes (responsive bar, utility-bar wrap, etc.)
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const els = items
      .map((i) => ({ id: i.id, el: document.getElementById(i.id) }))
      .filter((x): x is { id: string; el: HTMLElement } => !!x.el);
    if (els.length === 0) return;

    // The active tab is whichever section's top has most recently scrolled
    // past the trigger line (just below the sticky header + tab bar) — i.e.
    // the last section we've actually scrolled into, not just "intersecting
    // some arbitrary band." Simpler and more predictable than shrinking the
    // IntersectionObserver root by a fixed percentage, which misfires on
    // short sections.
    const measure = () => {
      const topGap = headerH + (navRef.current?.offsetHeight ?? 48) + 8;
      let current = els[0]!.id;
      for (const { id, el } of els) {
        if (el.getBoundingClientRect().top - topGap <= 0) {
          current = id;
        } else {
          break;
        }
      }
      setActive(current);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [items, headerH]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = headerH + (navRef.current?.offsetHeight ?? 48);
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div
      ref={navRef}
      style={{ top: headerH }}
      className="sticky z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="container relative mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((i) => {
            const isActive = active === i.id;
            return (
              <button
                key={i.id}
                onClick={() => go(i.id)}
                className={`relative shrink-0 whitespace-nowrap pb-1 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {i.label}
                {isActive && (
                  <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Edge fades + scroll arrows — only shown while there's more to scroll to */}
        {canScrollLeft && (
          <>
            <div className="pointer-events-none absolute bottom-0 left-4 top-0 w-10 bg-gradient-to-r from-white to-transparent dark:from-gray-900" />
            <button
              type="button"
              onClick={() => scrollTabs(-1)}
              aria-label="Scroll tabs left"
              className="absolute left-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
        {canScrollRight && (
          <>
            <div className="pointer-events-none absolute bottom-0 right-4 top-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-gray-900" />
            <button
              type="button"
              onClick={() => scrollTabs(1)}
              aria-label="Scroll tabs right"
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
