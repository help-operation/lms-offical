"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { dashboardApi, type RevenueByCourseRow, type DashboardFilters } from "../api";

const COLORS = ["#10b981", "#a64dff", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#ef4444", "#6366f1", "#06b6d4", "#f97316"];

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export function RevenueByCourseChart({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<RevenueByCourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .revenueByCourse(filters)
      .then((res) => setData(res.data.slice(0, 10)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full dark:from-emerald-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Revenue by Course</h2>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="h-5 w-5 border-2 border-brand-300 dark:border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 dark:text-slate-500">No revenue data for this period</div>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" vertical={false} />
              <XAxis
                dataKey="course"
                tick={{ fontSize: 9, fill: "var(--chart-tick, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(v: string) => (v.length > 15 ? v.slice(0, 15) + "…" : v)}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}k`} />
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
                formatter={(value) => [currency(Number(value)), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.revenue === maxRevenue ? "#10b981" : COLORS[index % COLORS.length]}
                    opacity={entry.revenue === maxRevenue ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
