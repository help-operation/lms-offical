"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useScrollHidden } from "@/shared/hooks/useScrollHidden";

// Course detail pages (/courses/[slug]) show a full-width floating enroll bar
// on mobile — this button needs to sit above it there, not just above the nav.
const COURSE_DETAIL_PATTERN = /^\/courses\/[^/]+$/;

type Props = {
  /** Mobile bottom nav never slides away (Elevate template) — stay above it instead of dropping down on scroll. */
  navAlwaysVisible?: boolean;
};

/** Floating "back to top" button — bottom-left, shown once the page is scrolled down. */
export function ScrollToTopButton({ navAlwaysVisible = false }: Props) {
  const pathname = usePathname();
  const isCourseDetail = COURSE_DETAIL_PATTERN.test(pathname);
  const scrollHidden = useScrollHidden();
  const navHidden = navAlwaysVisible ? false : scrollHidden;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={`fixed left-5 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 lg:bottom-5 ${
        isCourseDetail
          ? navHidden
            ? "bottom-24"
            : "bottom-40"
          : navHidden
            ? "bottom-8"
            : "bottom-24"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
