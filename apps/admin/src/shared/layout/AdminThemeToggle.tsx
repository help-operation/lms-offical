"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "skillkoro-admin-theme";
const ROOT_ID = "admin-dashboard-root";

function applyTheme(dark: boolean) {
  document.getElementById(ROOT_ID)?.classList.toggle("dark", dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

export function AdminThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const isDark = stored === "dark";
    document.getElementById(ROOT_ID)?.classList.toggle("dark", isDark);
    setDark(isDark);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    applyTheme(next);
    setDark(next);
  }

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-black dark:text-white shadow-sm shadow-black/[0.03] hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand/10 dark:hover:text-brand hover:scale-105 active:scale-95 transition-all duration-200 ${
        ready ? "" : "opacity-0"
      }`}
    >
      {dark ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />}
    </button>
  );
}
