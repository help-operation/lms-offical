"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardOverview } from "../api";

function Chart({ title, data, barColor, gradientId }: { title: string; data: { label: string; count: number }[]; barColor: string; gradientId: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-50/50 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">{title}</h2>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 py-10 text-center relative z-10">No visitor data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" barSize={16}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={barColor} stopOpacity={0.8} />
                <stop offset="100%" stopColor={barColor} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} width={90} />
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
            <Bar dataKey="count" fill={`url(#${gradientId})`} radius={[0, 6, 6, 0]} name="Visitors" />
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
      <Chart title="Top 5 Countries" data={countries} barColor="#7c3aed" gradientId="bar-countries" />
      <Chart title="Top 5 Bangladesh Cities" data={cities} barColor="#10b981" gradientId="bar-cities" />
    </div>
  );
}
