"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { dashboardApi, type EnrollmentTrendRow, type DashboardFilters } from "../api";

export function EnrollmentTrendChart({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<EnrollmentTrendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .enrollmentTrend(filters)
      .then((res) => setData(res.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/60 to-transparent rounded-bl-full dark:from-blue-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Student Enrollment Trend</h2>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="h-5 w-5 border-2 border-brand-300 dark:border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 dark:text-slate-500">No enrollment data for this period</div>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRecorded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a64dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a64dff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--chart-tick, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  fontSize: 12,
                  background: "var(--chart-tooltip-bg)",
                  color: "var(--chart-tooltip-text)",
                  padding: "8px 12px",
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => <span className="text-[11px] text-gray-500 dark:text-slate-400">{value}</span>}
              />
              <Area type="monotone" dataKey="total" name="Total" stroke="#f59e0b" strokeWidth={2} fill="url(#colorTotal)" dot={false} />
              <Area type="monotone" dataKey="recorded" name="Recorded" stroke="#a64dff" strokeWidth={2} fill="url(#colorRecorded)" dot={false} />
              <Area type="monotone" dataKey="live" name="Live" stroke="#10b981" strokeWidth={2} fill="url(#colorLive)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
