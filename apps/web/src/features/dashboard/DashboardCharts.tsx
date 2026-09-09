"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

interface EnrollmentData {
  courseTitle: string;
  courseType: "recorded" | "live";
  progress: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string | null;
  courseLevel: "beginner" | "intermediate" | "advanced";
  courseSlug: string;
  status: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff", "#ddd6fe"];

export function CourseProgressChart({ enrollments }: { enrollments: EnrollmentData[] }) {
  const data = enrollments
    .filter((e) => e.totalLessons > 0)
    .slice(0, 8)
    .map((e) => ({
      name: e.courseTitle.length > 20 ? e.courseTitle.slice(0, 20) + "..." : e.courseTitle,
      progress: e.progress,
      completed: e.completedLessons,
      total: e.totalLessons,
    }));

  if (data.length === 0) return null;

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg">Course Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value}%`, "Progress"]}
              />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnrollmentByTypeChart({ enrollments }: { enrollments: EnrollmentData[] }) {
  const recorded = enrollments.filter((e) => e.courseType === "recorded").length;
  const live = enrollments.filter((e) => e.courseType === "live").length;
  const data = [
    { name: "Self-Paced", value: recorded },
    { name: "Live Courses", value: live },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg">Enrollment Mix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6">
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={index === 0 ? "#6366f1" : "#f59e0b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: i === 0 ? "#6366f1" : "#f59e0b" }} />
                <span className="text-sm text-slate-600 dark:text-slate-300">{item.name}</span>
                <span className="ml-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LearningActivityChart({ enrollments }: { enrollments: EnrollmentData[] }) {
  // Group enrollments by enrolledAt month to show activity over time
  const monthMap = new Map<string, { count: number; lessons: number }>();
  enrollments.forEach((e) => {
    if (!e.enrolledAt) return;
    const d = new Date(e.enrolledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key) ?? { count: 0, lessons: 0 };
    existing.count += 1;
    existing.lessons += e.completedLessons;
    monthMap.set(key, existing);
  });

  const data = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { month: label, courses: val.count, lessons: val.lessons };
    });

  if (data.length === 0) return null;

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg">Learning Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="lessons" stroke="#6366f1" fill="url(#colorLessons)" strokeWidth={2} name="Lessons Completed" />
              <Area type="monotone" dataKey="courses" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Courses Joined" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Lessons Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-500 bg-transparent" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Courses Joined</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LevelDistributionChart({ enrollments }: { enrollments: EnrollmentData[] }) {
  const levelMap: Record<string, number> = {};
  enrollments.forEach((e) => {
    const level = e.courseLevel ?? "beginner";
    levelMap[level] = (levelMap[level] ?? 0) + 1;
  });
  const levelColors: Record<string, string> = {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
  };
  const data = Object.entries(levelMap).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: levelColors[level] ?? "#94a3b8",
  }));

  if (data.length === 0) return null;

  return (
    <Card className="border-0 bg-white shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg">Skill Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((d) => {
            const total = data.reduce((s, x) => s + x.value, 0);
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{d.value} course{d.value !== 1 ? "s" : ""}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
