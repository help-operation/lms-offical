"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { dashboardApi, type DashboardOverview } from "./api";
import { FilterBar, DEFAULT_FILTERS, toApiFilters, type DraftFilters } from "./FilterBar";
import { useDashboardSocket } from "@/hooks/use-dashboard-socket";
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
import { StudentGrowthChart } from "./sections/StudentGrowthChart";
import { RevenuePerformanceChart } from "./sections/RevenuePerformanceChart";
import { DistributionChart } from "./sections/DistributionChart";

export function DashboardV2Client() {
  const [draft, setDraft] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  const fetchData = useCallback(async (filters: DraftFilters) => {
    try {
      const res = await dashboardApi.overview(toApiFilters(filters));
      setData(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Dashboard overview fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchData(applied);
  }, [applied, fetchData]);

  // --- Socket: re-fetch on any dashboard event ---
  const handleDashboardUpdate = useCallback(() => {
    fetchData(appliedRef.current);
  }, [fetchData]);

  const { connected } = useDashboardSocket({ onDashboardUpdate: handleDashboardUpdate });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FilterBar
          draft={draft}
          onChange={setDraft}
          onReset={() => {
            setDraft(DEFAULT_FILTERS);
            setApplied(DEFAULT_FILTERS);
          }}
          onApply={() => setApplied(draft)}
          onPeriodChange={(p) => {
            if (p !== "custom") setApplied((prev) => ({ ...prev, period: p }));
          }}
        />
        {connected && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full ml-3 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-slate-500">
            <div className="h-5 w-5 border-2 border-brand-300 dark:border-brand-500 border-t-transparent rounded-full animate-spin" />
            Loading dashboard…
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-16">
          <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-xl border border-red-100 dark:border-red-500/20">
            Couldn&apos;t load the dashboard. Please try again.
          </div>
        </div>
      )}

      {data && (
        <>
          <TopSummaryStrip data={data} period={applied.period} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <StudentOverviewCard data={data} />
            </div>
            <div className="xl:col-span-1">
              <DistributionChart data={data.studentOverview} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <StudentGrowthChart data={data.studentOverview} />
            <RevenuePerformanceChart data={data} />
          </div>

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
