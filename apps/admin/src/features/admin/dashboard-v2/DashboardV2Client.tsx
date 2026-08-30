"use client";

import { useEffect, useState } from "react";
import { dashboardApi, type DashboardOverview } from "./api";
import { FilterBar, DEFAULT_FILTERS, toApiFilters, type DraftFilters } from "./FilterBar";
import { TopSummaryStrip } from "./sections/TopSummaryStrip";
import { StudentOverviewCard } from "./sections/StudentOverviewCard";
import { CourseCountDonut } from "./sections/CourseCountDonut";
import { VisitorSourceDonut } from "./sections/VisitorSourceDonut";
import { PerCourseStudentList } from "./sections/PerCourseStudentList";
import { SupportOverviewGrid } from "./sections/OverviewStatGrids";
import { VisitorActivityCard } from "./sections/VisitorActivityCard";
import { SystemHealthCard } from "./sections/SystemHealthCard";
import { PaymentMethodBreakdown } from "./sections/PaymentMethodBreakdown";
import { LocationBarCharts } from "./sections/LocationBarCharts";
import { DeviceDonut, GenderDonut } from "./sections/DeviceGenderDonuts";

export function DashboardV2Client() {
  const [draft, setDraft] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    dashboardApi
      .overview(toApiFilters(applied))
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("Dashboard overview fetch failed:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [applied]);

  return (
    <div className="space-y-6">
      <FilterBar
        draft={draft}
        onChange={setDraft}
        onReset={() => {
          setDraft(DEFAULT_FILTERS);
          setApplied(DEFAULT_FILTERS);
        }}
        onApply={() => setApplied(draft)}
        onPeriodChange={(p) => {
          // Instant-apply presets (Today/Week/Month/Year) so the cards update
          // right away. "Custom" still needs a date range picked + Filter/Update
          // clicked, since period=custom alone has no window to fetch yet.
          if (p !== "custom") setApplied((prev) => ({ ...prev, period: p }));
        }}
      />

      {loading && !data && <div className="text-sm text-gray-400 dark:text-slate-500 py-10 text-center">Loading dashboard…</div>}
      {error && <div className="text-sm text-red-500 dark:text-red-400 py-10 text-center">Couldn&apos;t load the dashboard. Please try again.</div>}

      {data && (
        <>
          <TopSummaryStrip data={data} period={applied.period} />

          <StudentOverviewCard data={data.studentOverview} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CourseCountDonut data={data.courseCount} />
            <VisitorSourceDonut data={data.visitorSource} />
          </div>

          <PerCourseStudentList />

          <VisitorActivityCard data={data.visitorActivity} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SystemHealthCard />
            <PaymentMethodBreakdown data={data.paymentMethods} />
          </div>

          <SupportOverviewGrid data={data.supportOverview} />

          <LocationBarCharts data={data.location} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <DeviceDonut data={data.devices} />
            <GenderDonut data={data.gender} />
          </div>
        </>
      )}
    </div>
  );
}
