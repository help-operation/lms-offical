"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("skillkoro-theme", dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

type Props = {
  /** Compact icon-only button (just the sun/moon glyph) instead of the sliding pill. */
  iconOnly?: boolean;
};

export function ThemeToggle({ iconOnly = false }: Props = {}) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  // Reconcile UI with the actual persisted/applied theme on mount
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("skillkoro-theme");
    } catch {
      /* ignore */
    }
    const isDark =
      stored === "dark" ||
      (stored === null && document.documentElement.classList.contains("dark"));
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    applyTheme(next);
    setDark(next);
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggle}
        className={`text-gray-600 dark:text-gray-300 hover:text-brand-solid transition-colors ${ready ? "" : "opacity-0"}`}
      >
        {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={`relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors ${
        dark ? "bg-brand-solid" : "bg-slate-200"
      } ${ready ? "" : "opacity-0"}`}
    >
      {/* Sliding knob */}
      <span
        className={`absolute z-0 inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
          dark ? "translate-x-[34px]" : "translate-x-0.5"
        }`}
      >
        {dark ? (
          <Moon className="h-3.5 w-3.5 text-brand" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>

      {/* Inactive-side icon hint (purely decorative) */}
      <span className="relative z-10 flex h-full w-1/2 items-center justify-center">
        <Sun
          className={`h-4 w-4 transition-opacity ${dark ? "text-white/60" : "opacity-0"}`}
        />
      </span>
      <span className="relative z-10 flex h-full w-1/2 items-center justify-center">
        <Moon
          className={`h-4 w-4 transition-opacity ${dark ? "opacity-0" : "text-slate-500"}`}
        />
      </span>
    </button>
  );
}
