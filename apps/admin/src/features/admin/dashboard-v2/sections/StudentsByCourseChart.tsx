"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { dashboardApi, type PerCourseStudentRow, type DashboardFilters } from "../api";

const COLORS = ["#a64dff", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6", "#ef4444", "#6366f1", "#06b6d4", "#f97316"];

export function StudentsByCourseChart({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<PerCourseStudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .perCourseStudents()
      .then((res) => {
        const sorted = res.data.sort((a, b) => b.students - a.students).slice(0, 10);
        setData(sorted);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const maxStudents = Math.max(...data.map((d) => d.students), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Students by Course</h2>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="h-5 w-5 border-2 border-brand-300 dark:border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400 dark:text-slate-500">No data</div>
      ) : (
        <div className="relative z-10 max-h-[320px] overflow-y-auto">
          <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 200)}>
            <BarChart data={data} layout="vertical" barSize={20} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--chart-tick, #9ca3af)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fontSize: 10, fill: "var(--chart-tick, #9ca3af)" }}
                axisLine={false}
                tickLine={false}
                width={120}
                tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
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
                formatter={(value) => [`${value} students`, "Enrolled"]}
              />
              <Bar dataKey="students" radius={[0, 4, 4, 0]} name="Students">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.students === maxStudents ? "#a64dff" : COLORS[index % COLORS.length]}
                    opacity={entry.students === maxStudents ? 1 : 0.75}
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
