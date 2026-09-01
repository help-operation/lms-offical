"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DashboardOverview } from "../api";

const BAR_COLORS = ["#a64dff", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6", "#ef4444", "#6366f1", "#06b6d4"];

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0";
  const m = Math.floor(seconds / 60);
  return m > 0 ? String(m) : String(seconds);
}

export function DistributionChart({ data, visitorActivity }: { data: DashboardOverview["studentOverview"]; visitorActivity?: DashboardOverview["visitorActivity"] }) {
  const chartData = [
    { label: "Total", value: data.totalStudents },
    { label: "Active", value: data.activeStudents },
    { label: "Certified", value: data.totalCertified },
    { label: "Live", value: data.liveCourseStudents },
    { label: "Recorded", value: data.recordedCourseStudents },
    { label: "Free", value: data.freeCourseStudents },
    { label: "Dropout", value: data.dropoutStudents },
    ...(visitorActivity
      ? [
          { label: "Today Active", value: visitorActivity.uniqueVisitors },
          { label: "Watch (min)", value: Math.round(visitorActivity.avgStaySeconds / 60) },
        ]
      : []),
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 relative z-10">Distribution</h2>
      <div className="relative z-10 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={20} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--chart-tick, #9ca3af)" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--chart-tick, #9ca3af)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                fontSize: 12,
                background: "var(--chart-tooltip-bg)",
                color: "var(--chart-tooltip-text)",
                padding: "6px 10px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Students">
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
