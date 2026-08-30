"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, BookOpen, Users, DollarSign, Star, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { DataTable, type Column } from "@repo/ui/data-table";

const earningData = [
  { month: "Jan", revenue: 2800 }, { month: "Feb", revenue: 4500 },
  { month: "Mar", revenue: 3200 }, { month: "Apr", revenue: 3800 },
  { month: "May", revenue: 4200 }, { month: "Jun", revenue: 5100 },
  { month: "Jul", revenue: 4000 }, { month: "Aug", revenue: 3500 },
  { month: "Sep", revenue: 3000 }, { month: "Oct", revenue: 2800 },
  { month: "Nov", revenue: 2400 }, { month: "Dec", revenue: 2100 },
];

const enrollData = [
  { month: "Jan", enrolled: 18, left: 5 }, { month: "Feb", enrolled: 32, left: 8 },
  { month: "Mar", enrolled: 24, left: 6 }, { month: "Apr", enrolled: 28, left: 7 },
  { month: "May", enrolled: 35, left: 9 }, { month: "Jun", enrolled: 40, left: 10 },
  { month: "Jul", enrolled: 30, left: 7 }, { month: "Aug", enrolled: 26, left: 6 },
  { month: "Sep", enrolled: 22, left: 5 }, { month: "Oct", enrolled: 20, left: 5 },
  { month: "Nov", enrolled: 17, left: 4 }, { month: "Dec", enrolled: 15, left: 3 },
];

const avatarColors = ["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400", "bg-green-400"];

interface Course {
  id: number;
  title: string;
  status: string;
  totalStudents?: number;
  totalLessons?: number;
}

interface Stats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgRating: number | null;
}

export function InstructorDashboardClient({
  stats,
  recentCourses,
  userName,
}: {
  stats: Stats;
  recentCourses: Course[];
  userName: string;
}) {
  const statCards = [
    { label: "Total Courses", value: stats.totalCourses.toString(), sub: `${stats.publishedCourses} published`, change: "+12.05%", positive: true, icon: BookOpen, iconBg: "bg-brand-100 dark:bg-brand/15", iconColor: "text-brand-600 dark:text-brand" },
    { label: "Total Students", value: stats.totalStudents.toLocaleString(), sub: "enrolled", change: "+25.21%", positive: true, icon: Users, iconBg: "bg-blue-100 dark:bg-blue-500/15", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, sub: "lifetime", change: "+12.05%", positive: true, icon: DollarSign, iconBg: "bg-green-100 dark:bg-green-500/15", iconColor: "text-green-600 dark:text-green-400" },
    { label: "Avg Rating", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", sub: "across courses", change: "+3.5%", positive: true, icon: Star, iconBg: "bg-yellow-100 dark:bg-yellow-500/15", iconColor: "text-yellow-600 dark:text-yellow-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, <span className="text-brand-600 dark:text-brand">{userName}!</span>
        </h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Track your manage and LMS platform performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{card.label}</p>
              <div className="flex -space-x-1.5">
                {avatarColors.slice(0, 3).map((color, j) => (
                  <div key={j} className={`h-5 w-5 rounded-full ${color} border border-white dark:border-slate-900`} />
                ))}
                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-slate-700 border border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-slate-300">5+</div>
              </div>
            </div>
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} mb-3`}>
              <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{card.sub}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`h-3.5 w-3.5 ${card.positive ? "text-green-500" : "text-red-500"}`} />
              <span className={`text-xs font-semibold ${card.positive ? "text-green-500" : "text-red-500"}`}>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Student Analysis</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400 text-[10px] font-semibold">-3.5%</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-slate-500">This year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={enrollData}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12, background: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-text)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="enrolled" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#enrollGrad)" name="Enrolled" dot={false} />
              <Area type="monotone" dataKey="left" stroke="#f43f5e" strokeWidth={2} fill="transparent" name="Left" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400 text-[10px] font-semibold">+23.5%</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-slate-500">This year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={earningData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12, background: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-text)" }} formatter={(v) => [`৳${Number(v).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent courses table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Courses</h2>
          <Link href="/admin/courses" className="text-xs font-semibold text-brand-600 dark:text-brand hover:text-brand-700 dark:hover:text-brand/80 flex items-center gap-1">
            View All <span>›</span>
          </Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">No courses yet.</p>
            <Link href="/admin/courses/new" className="text-xs text-brand-600 dark:text-brand hover:underline mt-1 inline-block">
              Create your first course
            </Link>
          </div>
        ) : (
          <DataTable
            data={recentCourses}
            columns={[
              {
                key: "title",
                header: "Course Name",
                render: (course: Course, i: number) => (
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                      {course.title[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">{course.title}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">#{course.id}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "totalStudents",
                header: "Students",
                render: (course: Course) => <span className="text-xs text-gray-700 dark:text-slate-300">{course.totalStudents ?? 0}</span>,
              },
              {
                key: "totalLessons",
                header: "Lessons",
                render: (course: Course) => <span className="text-xs text-gray-700 dark:text-slate-300">{course.totalLessons ?? 0}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (course: Course) => <CourseBadge status={course.status} />,
              },
              {
                key: "actions",
                header: "Action",
                render: () => (
                  <div className="flex items-center gap-1.5">
                    <ActionBtn color="bg-brand-100 text-brand-600 hover:bg-brand-200 dark:bg-brand/15 dark:text-brand dark:hover:bg-brand/25"><Eye className="h-3 w-3" /></ActionBtn>
                    <Link href="/admin/courses">
                      <ActionBtn color="bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"><Pencil className="h-3 w-3" /></ActionBtn>
                    </Link>
                    <ActionBtn color="bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"><Trash2 className="h-3 w-3" /></ActionBtn>
                  </div>
                ),
              },
            ] as Column<Course>[]}
            emptyMessage="No courses yet"
            pageSize={10}
            showPageSizeSelector={false}
          />
        )}
      </div>
    </div>
  );
}

function CourseBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    draft: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
    archived: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400"}`}>
      {status}
    </span>
  );
}

function ActionBtn({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <button className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${color}`}>
      {children}
    </button>
  );
}
