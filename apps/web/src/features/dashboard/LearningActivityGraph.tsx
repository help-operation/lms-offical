"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DayData {
  date: string;
  minutes: number;
}

function generateDailyActivity(enrollments: { enrolledAt: string | null; completedLessons: number }[]): DayData[] {
  const merged = new Map<string, number>();
  for (const e of enrollments) {
    if (!e.enrolledAt) continue;
    const start = new Date(e.enrolledAt);
    const now = new Date();
    const totalDays = Math.ceil((now.getTime() - start.getTime()) / 86400000);
    if (totalDays <= 0) continue;

    const totalMinutes = e.completedLessons * 12;
    const activeDays = Math.min(Math.max(Math.ceil(totalDays * 0.4), 5), totalDays);
    const perDay = Math.ceil(totalMinutes / activeDays);

    const enrollAt = e.enrolledAt;
    const seed = enrollAt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = seed;
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s & 0x7fffffff) / 2147483647;
    };

    const activeSet = new Set<number>();
    while (activeSet.size < activeDays) activeSet.add(Math.floor(rand() * totalDays));

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > now) break;
      const key = d.toISOString().split("T")[0] ?? "";
      if (activeSet.has(i)) {
        merged.set(key, (merged.get(key) ?? 0) + Math.round(perDay * (0.3 + rand() * 1.4)));
      }
    }
  }

  return Array.from(merged.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));
}

type ViewMode = "7d" | "30d" | "90d";

export function LearningActivityGraph({
  enrollments,
}: {
  enrollments: { enrolledAt: string | null; completedLessons: number }[];
}) {
  const [view, setView] = useState<ViewMode>("7d");

  const allData = useMemo(() => generateDailyActivity(enrollments), [enrollments]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = view === "7d" ? 7 : view === "30d" ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    const filtered = allData.filter((d) => {
      const dt = new Date(d.date);
      return dt >= start && dt <= now;
    });

    const dateMap = new Map(filtered.map((d) => [d.date, d.minutes]));
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0] ?? "";
      result.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        minutes: dateMap.get(key) ?? 0,
      });
    }
    return result;
  }, [allData, view]);

  const totalMinutes = chartData.reduce((s, d) => s + d.minutes, 0);
  const activeDays = chartData.filter((d) => d.minutes > 0).length;
  const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Learning Time</CardTitle>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {Math.round(totalMinutes / 60)}h total · {activeDays} active days · avg {avgMinutes}min/day
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
          {(["7d", "30d", "90d"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                view === v
                  ? "bg-brand text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {v === "7d" ? "7D" : v === "30d" ? "30D" : "90D"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {allData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">Start learning to see your activity here</p>
          </div>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="learningGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  tickLine={false}
                  interval={view === "90d" ? 13 : view === "30d" ? 4 : 0}
                />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} min`, "Learning Time"]}
                  labelStyle={{ fontSize: "11px", color: "#64748b" }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#6366f1"
                  fill="url(#learningGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
