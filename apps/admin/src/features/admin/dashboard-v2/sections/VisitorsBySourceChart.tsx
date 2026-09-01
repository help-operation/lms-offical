"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DashboardOverview } from "../api";

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  youtube: "#ff0000",
  website: "#a64dff",
  instagram: "#e4405f",
  direct: "#10b981",
  linkedin: "#0a66c2",
  twitter: "#1da1f2",
  other: "#6b7280",
};

const DEFAULT_COLORS = ["#a64dff", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6", "#ef4444", "#6366f1", "#06b6d4"];

export function VisitorsBySourceChart({ data }: { data: DashboardOverview["visitorSource"] }) {
  const chartData = Object.entries(data.bySource)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      count,
      color: SOURCE_COLORS[source] || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    }));

  const maxCount = Math.max(...chartData.map((d) => d.count), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full dark:from-emerald-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Visitors by Source</h2>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 dark:text-slate-500">No data</div>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 200)}>
            <BarChart data={chartData} layout="vertical" barSize={20} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                width={80}
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
                formatter={(value) => [`${value} visitors`, "Count"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Visitors">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === maxCount ? entry.color : entry.color}
                    opacity={entry.count === maxCount ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 relative z-10">
        {chartData.map((d) => (
          <div key={d.source} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-gray-500 dark:text-slate-400">{d.source}</span>
            <span className="text-[10px] font-semibold text-gray-700 dark:text-slate-300">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
