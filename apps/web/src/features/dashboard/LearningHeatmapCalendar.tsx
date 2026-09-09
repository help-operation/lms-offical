"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeatmapDay {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function generateActivityData(enrolledAt: string | null, completedLessons: number): Map<string, number> {
  const data = new Map<string, number>();
  if (!enrolledAt) return data;

  const startStr = enrolledAt;
  const start = new Date(startStr);
  const now = new Date();
  const totalDays = Math.ceil((now.getTime() - start.getTime()) / 86400000);
  if (totalDays <= 0) return data;

  const totalMinutes = completedLessons * 12;
  const activeDays = Math.min(Math.max(Math.ceil(totalDays * 0.4), 5), totalDays);
  const minutesPerActiveDay = Math.ceil(totalMinutes / activeDays);

  const seed = startStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };

  const activeDayIndices = new Set<number>();
  while (activeDayIndices.size < activeDays) {
    activeDayIndices.add(Math.floor(rand() * totalDays));
  }

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0] ?? "";
    if (activeDayIndices.has(i)) {
      const variance = 0.3 + rand() * 1.4;
      data.set(key, Math.round(minutesPerActiveDay * variance));
    }
  }
  return data;
}

function getLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 45) return 2;
  if (minutes <= 90) return 3;
  return 4;
}

const LEVEL_COLORS = [
  "bg-slate-100 dark:bg-slate-800",
  "bg-emerald-200 dark:bg-emerald-900/40",
  "bg-emerald-300 dark:bg-emerald-700/50",
  "bg-emerald-500 dark:bg-emerald-500/70",
  "bg-emerald-700 dark:bg-emerald-400",
];

const LEVEL_LABELS = ["No activity", "1-15 min", "16-45 min", "46-90 min", "90+ min"];

export function LearningHeatmapCalendar({
  enrollments,
}: {
  enrollments: { enrolledAt: string | null; completedLessons: number }[];
}) {
  const [offset, setOffset] = useState(0);

  const allActivity = useMemo(() => {
    const merged = new Map<string, number>();
    for (const e of enrollments) {
      const data = generateActivityData(e.enrolledAt, e.completedLessons);
      for (const [k, v] of data) {
        merged.set(k, (merged.get(k) ?? 0) + v);
      }
    }
    return merged;
  }, [enrollments]);

  const weeks = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + offset * 7);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 16 * 7 + 1);

    const result: HeatmapDay[][] = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay());

    while (current <= endDate) {
      const week: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const key = current.toISOString().split("T")[0] ?? "";
        const minutes = allActivity.get(key) ?? 0;
        week.push({ date: key, minutes, level: getLevel(minutes) });
        current.setDate(current.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [allActivity, offset]);

  const totalMinutes = useMemo(() => {
    let sum = 0;
    for (const week of weeks) {
      for (const day of week) {
        sum += day.minutes;
      }
    }
    return sum;
  }, [weeks]);

  const activeDays = useMemo(() => {
    let count = 0;
    for (const week of weeks) {
      for (const day of week) {
        if (day.minutes > 0) count++;
      }
    }
    return count;
  }, [weeks]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Learning Activity</CardTitle>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {activeDays} active days \u00B7 {Math.round(totalMinutes / 60)}h total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setOffset(0)}
            disabled={offset === 0}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[60px] text-center text-xs text-slate-500 dark:text-slate-400">
            {offset === 0 ? "Current" : `${Math.abs(offset)}w ${offset < 0 ? "ago" : "ahead"}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-1">
              {dayLabels.map((label, i) => (
                <div key={i} className="flex h-[14px] items-center text-[9px] text-slate-400 dark:text-slate-500">
                  {label}
                </div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`group relative h-[14px] w-[14px] rounded-[3px] ${LEVEL_COLORS[day.level]} cursor-default transition-transform hover:scale-125`}
                  >
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] text-white shadow-lg group-hover:block dark:bg-slate-700">
                      <p className="font-medium">{new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="text-slate-300">{day.minutes > 0 ? `${day.minutes} min` : "No activity"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[9px] text-slate-400 dark:text-slate-500">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} title={LEVEL_LABELS[i]} />
          ))}
          <span className="text-[9px] text-slate-400 dark:text-slate-500">More</span>
        </div>
      </CardContent>
    </Card>
  );
}
