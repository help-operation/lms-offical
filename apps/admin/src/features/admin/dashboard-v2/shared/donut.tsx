"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ title, slices, centerLabel }: { title: string; slices: DonutSlice[]; centerLabel?: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const data = slices.filter((s) => s.value > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 relative z-10">{title}</h2>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={42}
              outerRadius={62}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((s) => (
                <Cell key={s.label} fill={s.color} className="drop-shadow-sm" />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{centerLabel ?? "Total"}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 relative z-10">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span className="text-gray-400 dark:text-slate-500">({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
