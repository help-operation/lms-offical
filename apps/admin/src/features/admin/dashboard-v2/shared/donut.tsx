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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-4">
      <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <div className="relative">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={38} outerRadius={56} paddingAngle={2}>
              {data.map((s) => (
                <Cell key={s.label} fill={s.color} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">{centerLabel ?? "Total"}</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} ({s.value})
          </div>
        ))}
      </div>
    </div>
  );
}
