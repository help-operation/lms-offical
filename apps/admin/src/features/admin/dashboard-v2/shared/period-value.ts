import type { DashboardPeriod } from "@repo/ui/dashboard-filter-bar";

/** Numeric buckets shared by New Student / Lead / Revenue / Receivable overview payloads. */
export interface PeriodBuckets {
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
  filtered: number;
}

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Selected Range",
};

/** Picks the bucket matching the currently-selected period tab ("custom" reads the filtered/custom-range bucket). */
export function periodValue(data: PeriodBuckets, period: DashboardPeriod): number {
  return period === "custom" ? data.filtered : data[period];
}

export function periodLabel(period: DashboardPeriod, suffix: string): string {
  return `${PERIOD_LABEL[period]} ${suffix}`;
}

export interface WindowStat {
  count: number;
  change: number | null;
}

/** Same shape as PeriodBuckets, but each bucket also carries a %-change (used by the New Student card). */
export interface PeriodWindowStats {
  today: WindowStat;
  week: WindowStat;
  month: WindowStat;
  year: WindowStat;
  total: WindowStat;
  filtered: WindowStat;
}

export function periodWindowStat(data: PeriodWindowStats, period: DashboardPeriod): WindowStat {
  return period === "custom" ? data.filtered : data[period];
}
