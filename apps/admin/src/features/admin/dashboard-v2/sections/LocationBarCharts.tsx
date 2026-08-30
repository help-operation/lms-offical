"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardOverview } from "../api";

function Chart({ title, data, barColor }: { title: string; data: { label: string; count: number }[]; barColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 py-10 text-center">No visitor data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                fontSize: 12,
                background: "var(--chart-tooltip-bg)",
                color: "var(--chart-tooltip-text)",
              }}
            />
            <Bar dataKey="count" fill={barColor} radius={[0, 4, 4, 0]} name="Visitors" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function LocationBarCharts({ data }: { data: DashboardOverview["location"] }) {
  const countries = data.topCountries.map((c) => ({ label: c.country ?? "Unknown", count: c.count }));
  const cities = data.topBangladeshCities.map((c) => ({ label: c.city ?? "Unknown", count: c.count }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Chart title="Top 5 Countries" data={countries} barColor="#7c3aed" />
      <Chart title="Top 5 Bangladesh Cities" data={cities} barColor="#22c55e" />
    </div>
  );
}
