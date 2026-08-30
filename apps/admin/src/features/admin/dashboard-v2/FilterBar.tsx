"use client";

import type { DateRange } from "@repo/ui/date-range-picker";
import { DashboardFilterBar, type DashboardPeriod } from "@repo/ui/dashboard-filter-bar";
import type { DashboardFilters } from "./api";

export interface DraftFilters {
  period: DashboardPeriod;
  customRange: DateRange | null;
  courseId: string;
  courseType: "recorded" | "live" | "all";
  instructorId: string;
  packageId: string;
  location: string;
  device: string;
  gender: string;
  source: string;
}

export const DEFAULT_FILTERS: DraftFilters = {
  period: "month",
  customRange: null,
  courseId: "all",
  courseType: "all",
  instructorId: "all",
  packageId: "all",
  location: "all",
  device: "all",
  gender: "all",
  source: "all",
};

export function toApiFilters(f: DraftFilters): DashboardFilters {
  return {
    period: f.period,
    date_from: f.period === "custom" ? f.customRange?.from : undefined,
    date_to: f.period === "custom" ? f.customRange?.to : undefined,
    course_id: f.courseId !== "all" ? f.courseId : undefined,
    course_type: f.courseType !== "all" ? f.courseType : undefined,
    instructor_id: f.instructorId !== "all" ? f.instructorId : undefined,
    package_id: f.packageId !== "all" ? f.packageId : undefined,
    location: f.location !== "all" ? f.location : undefined,
    device: f.device !== "all" ? (f.device as DashboardFilters["device"]) : undefined,
    gender: f.gender !== "all" ? (f.gender as DashboardFilters["gender"]) : undefined,
    source: f.source !== "all" ? f.source : undefined,
  };
}

export function FilterBar({
  draft,
  onChange,
  onReset,
  onApply,
  onPeriodChange,
}: {
  draft: DraftFilters;
  onChange: (draft: DraftFilters) => void;
  onReset: () => void;
  onApply: () => void;
  /** Fires in addition to onChange when a period tab (Today/Week/Month/Year/Custom) is clicked — lets the parent instant-apply presets without waiting for the Filter button. */
  onPeriodChange?: (period: DashboardPeriod) => void;
}) {
  const set = <K extends keyof DraftFilters>(key: K, value: DraftFilters[K]) => onChange({ ...draft, [key]: value });

  // Dark mode is scoped to this div (not <html>), so Radix's default
  // portal-to-document.body would render the date-range popover outside
  // the .dark ancestor chain — point it at the scoped root instead.
  const portalContainer = typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined;

  return (
    <DashboardFilterBar
      period={draft.period}
      customRange={draft.customRange}
      onPeriodChange={(p) => {
        set("period", p);
        onPeriodChange?.(p);
      }}
      onCustomRangeChange={(r) => set("customRange", r)}
      onReset={onReset}
      onApply={onApply}
      portalContainer={portalContainer}
    />
  );
}
