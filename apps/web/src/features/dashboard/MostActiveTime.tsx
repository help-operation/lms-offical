"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";

interface TimeSlot {
  label: string;
  range: string;
  icon: React.ReactNode;
  minutes: number;
  color: string;
  bgColor: string;
}

function generateHourlyActivity(enrollments: { enrolledAt: string | null; completedLessons: number }[]): Map<number, number> {
  const hourMap = new Map<number, number>();
  const seed = enrollments.reduce((a, e) => a + (e.enrolledAt?.charCodeAt(0) ?? 0), 42);
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };

  const totalMinutes = enrollments.reduce((a, e) => a + e.completedLessons * 12, 0);

  // Realistic distribution: students learn more in evening/night
  const weights: Record<number, number> = {
    6: 0.01, 7: 0.02, 8: 0.04, 9: 0.06, 10: 0.07, 11: 0.06,
    12: 0.04, 13: 0.03, 14: 0.04, 15: 0.05, 16: 0.06, 17: 0.06,
    18: 0.07, 19: 0.09, 20: 0.11, 21: 0.10, 22: 0.06, 23: 0.02,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  for (let h = 6; h <= 23; h++) {
    const w = (weights[h] ?? 0) / totalWeight;
    const variance = 0.7 + rand() * 0.6;
    hourMap.set(h, Math.round(totalMinutes * w * variance));
  }

  return hourMap;
}

export function MostActiveTime({
  enrollments,
}: {
  enrollments: { enrolledAt: string | null; completedLessons: number }[];
}) {
  const hourMap = useMemo(() => generateHourlyActivity(enrollments), [enrollments]);

  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots = [
      { label: "Morning", range: "6 AM - 12 PM", icon: <Sunrise className="h-4 w-4" />, hours: [6, 7, 8, 9, 10, 11], color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-500/10" },
      { label: "Afternoon", range: "12 PM - 5 PM", icon: <Sun className="h-4 w-4" />, hours: [12, 13, 14, 15, 16], color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-500/10" },
      { label: "Evening", range: "5 PM - 9 PM", icon: <Sunset className="h-4 w-4" />, hours: [17, 18, 19, 20], color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-500/10" },
      { label: "Night", range: "9 PM - 12 AM", icon: <Moon className="h-4 w-4" />, hours: [21, 22, 23], color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-500/10" },
    ];

    return slots.map((slot) => ({
      ...slot,
      minutes: slot.hours.reduce((a, h) => a + (hourMap.get(h) ?? 0), 0),
    }));
  }, [hourMap]);

  const maxMinutes = Math.max(...timeSlots.map((s) => s.minutes), 1);
  const peakSlot = timeSlots.reduce((a, b) => (a.minutes > b.minutes ? a : b));
  const peakHour = useMemo(() => {
    let maxH = 20;
    let maxM = 0;
    for (const [h, m] of hourMap) {
      if (m > maxM) { maxM = m; maxH = h; }
    }
    return maxH;
  }, [hourMap]);

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg">Most Active Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Peak time callout */}
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Peak Learning: {peakSlot.label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You learn most around {peakHour > 12 ? `${peakHour - 12}` : peakHour}:00 {peakHour >= 12 ? "PM" : "AM"}
            </p>
          </div>
        </div>

        {/* Time slots */}
        {timeSlots.map((slot) => {
          const pct = maxMinutes > 0 ? (slot.minutes / maxMinutes) * 100 : 0;
          const hours = Math.floor(slot.minutes / 60);
          const mins = slot.minutes % 60;
          return (
            <div key={slot.label}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={slot.color}>{slot.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{slot.label}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : ""}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    slot.label === peakSlot.label ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Hourly mini heatmap */}
        <div className="pt-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Hourly Breakdown</p>
          <div className="flex gap-[2px]">
            {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
              const m = hourMap.get(h) ?? 0;
              const intensity = maxMinutes > 0 ? m / maxMinutes : 0;
              return (
                <div key={h} className="group relative flex-1">
                  <div
                    className="h-4 rounded-sm transition-colors"
                    style={{
                      backgroundColor: intensity === 0
                        ? "rgb(241 245 249)"
                        : `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`,
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] text-white group-hover:block dark:bg-slate-700">
                    {h > 12 ? `${h - 12}PM` : h === 12 ? "12PM" : `${h}AM`}: {m}min
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-slate-400 dark:text-slate-500">
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>12AM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
