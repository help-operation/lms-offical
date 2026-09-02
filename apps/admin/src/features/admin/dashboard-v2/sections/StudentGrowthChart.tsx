"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardApi, type DashboardFilters, type StudentGrowthRow } from "../api";

export function StudentGrowthChart({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<StudentGrowthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardApi.studentGrowth(filters).then((res) => {
      if (!cancelled) {
        setData(res.data ?? []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const totalStudents = data.length > 0 ? (data[data.length - 1]?.totalStudents ?? 0) : 0;
  const firstStudents = data.length > 0 ? (data[0]?.totalStudents ?? 0) : 0;
  const changePercent = firstStudents > 0 ? Math.round(((totalStudents - firstStudents) / firstStudents) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Student Growth</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents.toLocaleString()}</span>
            {changePercent > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                +{changePercent}%
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a64dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a64dff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }}
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
                  padding: "8px 12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => [
                  Number(value).toLocaleString(),
                  name === "totalStudents" ? "Total" : "New",
                ]) as any}
              />
              <Area
                type="monotone"
                dataKey="totalStudents"
                stroke="#a64dff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorStudents)"
                name="totalStudents"
              />
              <Area
                type="monotone"
                dataKey="newStudents"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={0.1}
                fill="#10b981"
                name="newStudents"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
