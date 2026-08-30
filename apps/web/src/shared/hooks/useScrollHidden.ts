"use client";

import { useEffect, useRef, useState } from "react";

// Minimum scroll distance (px) before we react — avoids jitter from tiny
// scroll deltas (e.g. rubber-band bounce on iOS).
const SCROLL_THRESHOLD = 10;

/**
 * Tracks scroll direction so floating mobile UI (bottom nav, scroll-to-top,
 * callback button) can hide/show in sync: hidden while scrolling down, shown
 * again on scroll-up or near the top of the page.
 */
export function useScrollHidden() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      if (y < 80) {
        setHidden(false);
      } else {
        setHidden(delta > 0);
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
