"use client";

import { useEffect, useRef } from "react";
import { trackScrollDepth } from "@/shared/utils/dataLayer";

const THRESHOLDS = [25, 50, 75, 90] as const;

/** Fires each scroll-depth threshold at most once per page view. Renders nothing. */
export function ScrollDepthTracker() {
  const firedRef = useRef<Set<(typeof THRESHOLDS)[number]>>(new Set());

  useEffect(() => {
    function handleScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const threshold of THRESHOLDS) {
        if (pct >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          trackScrollDepth(threshold);
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
