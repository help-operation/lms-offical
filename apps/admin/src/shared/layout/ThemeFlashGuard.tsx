"use client";

import { useEffect } from "react";

/**
 * Applies the persisted dark-mode class before first paint to prevent flash.
 * Must be rendered as early as possible in the layout tree.
 */
export function ThemeFlashGuard() {
  useEffect(() => {
    try {
      if (localStorage.getItem("leerney-admin-theme") === "dark") {
        document.getElementById("admin-dashboard-root")?.classList.add("dark");
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
