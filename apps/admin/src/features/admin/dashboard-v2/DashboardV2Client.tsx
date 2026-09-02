"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Users, ShoppingCart, BarChart3, FileText } from "lucide-react";
import { dashboardApi, type DashboardOverview } from "./api";
import { FilterBar, DEFAULT_FILTERS, toApiFilters, type DraftFilters } from "./FilterBar";
import { useDashboardSocket } from "@/hooks/use-dashboard-socket";
import { TopSummaryStrip } from "./sections/TopSummaryStrip";
import { StudentOverviewCard } from "./sections/StudentOverviewCard";

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
import { StudentsByCourseChart } from "./sections/StudentsByCourseChart";
import { VisitorsBySourceChart } from "./sections/VisitorsBySourceChart";
import { EnrollmentTrendChart } from "./sections/EnrollmentTrendChart";
import { RevenueByCourseChart } from "./sections/RevenueByCourseChart";
import { SmsOverviewCard } from "./sections/SmsOverviewCard";
import { EmailOverviewCard } from "./sections/EmailOverviewCard";

const QUICK_ACTIONS = [
  { label: "Students", icon: Users, href: "/admin/students", color: "text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand/10 dark:hover:bg-brand/20" },
  { label: "Orders", icon: ShoppingCart, href: "/admin/revenue", color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20" },
  { label: "Courses", icon: BarChart3, href: "/admin/courses", color: "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20" },
  { label: "Reports", icon: FileText, href: "/admin/reports", color: "text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20" },
];

export function DashboardV2Client() {
  const [draft, setDraft] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  const fetchData = useCallback(async (filters: DraftFilters, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await dashboardApi.overview(toApiFilters(filters));
      setData(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Dashboard overview fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchData(applied);
  }, [applied, fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData(appliedRef.current, true);
  }, [fetchData]);

  // --- Socket: re-fetch on any dashboard event ---
  const handleDashboardUpdate = useCallback(() => {
    fetchData(appliedRef.current);
  }, [fetchData]);

  const { connected } = useDashboardSocket({ onDashboardUpdate: handleDashboardUpdate });

  return (
    <div className="space-y-5">
      {/* Top Controls Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Left: Filter Bar */}
          <div className="flex-1">
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
          </div>

          {/* Right: Controls + Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${action.color}`}
                  title={action.label}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{action.label}</span>
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Live Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              connected
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                : "text-gray-500 bg-gray-50 dark:text-slate-400 dark:bg-slate-800"
            }`}>
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-gray-400 dark:bg-slate-500"}`} />
              <span>{connected ? "LIVE" : "OFFLINE"}</span>
            </div>
          </div>
        </div>
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
        <div className="flex items-center justify-between py-3 px-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
          <span>Couldn&apos;t load the dashboard. Please try again.</span>
          <button onClick={handleRefresh} className="text-xs font-semibold underline hover:no-underline">Retry</button>
        </div>
      )}

      {data && (
        <>
          <TopSummaryStrip data={data} period={applied.period} />

          {/* Student Overview: 60% + Distribution: 40% */}
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            <div className="xl:w-[60%]">
              <StudentOverviewCard data={data} />
            </div>
            <div className="xl:w-[40%]">
              <DistributionChart data={data.studentOverview} visitorActivity={data.visitorActivity} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <StudentGrowthChart filters={toApiFilters(applied)} />
            <RevenuePerformanceChart filters={toApiFilters(applied)} />
          </div>

          {/* Row 1: Students by Course + Visitors by Source */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <StudentsByCourseChart filters={toApiFilters(applied)} />
            <VisitorsBySourceChart data={data.visitorSource} />
          </div>

          {/* Row 2: Enrollment Trend + Revenue by Course */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <EnrollmentTrendChart filters={toApiFilters(applied)} />
            <RevenueByCourseChart filters={toApiFilters(applied)} />
          </div>

          <PerCourseStudentList />

          <VisitorActivityCard data={data.visitorActivity} />

          <SmsOverviewCard />
          <EmailOverviewCard />

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
