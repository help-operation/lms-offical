"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { dashboardApi, type DashboardFilters, type RevenueTimeSeriesRow } from "../api";

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export function RevenuePerformanceChart({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<RevenueTimeSeriesRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardApi.revenueTimeSeries(filters).then((res) => {
      if (!cancelled) {
        setData(res.data ?? []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const totalRevenue = data.reduce((sum, d) => sum + d.total, 0);
  const totalRecorded = data.reduce((sum, d) => sum + d.recorded, 0);
  const totalLive = data.reduce((sum, d) => sum + d.live, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full dark:from-emerald-500/5" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Performance</h2>
          <div className="mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{currency(totalRevenue)}</span>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Total Revenue</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Recorded: {currency(totalRecorded)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Live: {currency(totalLive)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
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
                tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}k`}
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
                formatter={((value: any, name: any) => [currency(Number(value)), name === "recorded" ? "Recorded" : name === "live" ? "Live" : "Total"]) as any}
              />
              <Legend
                verticalAlign="top"
                height={24}
                formatter={(value: string) => value === "recorded" ? "Recorded" : value === "live" ? "Live" : "Total"}
              />
              <Line
                type="monotone"
                dataKey="recorded"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="recorded"
              />
              <Line
                type="monotone"
                dataKey="live"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="live"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#a64dff"
                strokeWidth={2.5}
                dot={false}
                name="total"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
