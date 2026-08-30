"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ListVideo, X } from "lucide-react";
import { LearnSidebarContent, type LearnSidebarProps } from "./LearnSidebar";

/**
 * Mobile-only (`md:hidden`) access to the course contents. Renders a trigger
 * button for the learn header plus a portalled slide-out drawer that mirrors
 * the desktop {@link LearnSidebar}, so phone/tablet users can jump between
 * lessons instead of only relying on the "Next lesson" link.
 */
export function LearnMobileSidebar(props: LearnSidebarProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portals require the DOM, so only render the overlay after mount.
  useEffect(() => setMounted(true), []);

  // Close the drawer whenever the route changes (a lesson tap inside it).
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        aria-label="Course content"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ListVideo className="h-5 w-5" />
      </button>

      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`md:hidden fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out drawer */}
            <div
              className={`md:hidden fixed inset-y-0 left-0 z-[70] flex w-[85%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-[#121217] ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Course content"
            >
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  type="button"
                  aria-label="Close course content"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <LearnSidebarContent {...props} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
