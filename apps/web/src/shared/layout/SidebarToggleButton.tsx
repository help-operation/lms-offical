"use client";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/shared/layout/SidebarContext";

export function SidebarToggleButton() {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle sidebar"
      className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 lg:flex"
    >
      <PanelLeft className="h-[18px] w-[18px]" />
    </button>
  );
}
