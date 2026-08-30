"use client";

import type { ReactNode } from "react";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import { cn } from "../utils";

export type DashboardPeriod = "today" | "week" | "month" | "year" | "custom";

const PRESETS: { label: string; value: DashboardPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

export interface DashboardFilterBarProps {
  period: DashboardPeriod;
  customRange: DateRange | null;
  onPeriodChange: (p: DashboardPeriod) => void;
  onCustomRangeChange: (r: DateRange | null) => void;
  onReset: () => void;
  onApply: () => void;
  /** Slot for the dropdown filters (Course/Instructor/Package/Location/Device/Gender/Source). */
  children?: ReactNode;
  className?: string;
  /** Passed through to the custom-range DateRangePicker's popover portal. */
  portalContainer?: HTMLElement | null;
}

export function DashboardFilterBar({
  period,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
  onReset,
  onApply,
  children,
  className,
  portalContainer,
}: DashboardFilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none", className)}>
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 overflow-x-auto dark:bg-slate-800">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={cn(
              "cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              period === p.value
                ? "bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-brand"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onPeriodChange("custom")}
          className={cn(
            "cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
            period === "custom"
              ? "bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-brand"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          Custom
        </button>
      </div>

      {period === "custom" && (
        <DateRangePicker value={customRange} onChange={onCustomRangeChange} placeholder="Pick a date range" portalContainer={portalContainer} />
      )}

      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>

      <div className="flex items-center gap-2 justify-end sm:justify-start">
        <button
          onClick={onReset}
          className="cursor-pointer whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="cursor-pointer whitespace-nowrap rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors dark:bg-brand dark:hover:bg-brand/90"
        >
          Filter
        </button>
      </div>
    </div>
  );
}
