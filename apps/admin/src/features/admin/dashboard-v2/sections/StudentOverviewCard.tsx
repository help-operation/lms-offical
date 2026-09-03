import { Users, UserCheck, Award, Video, BookOpen, Gift, UserMinus, UserCog, Clock } from "lucide-react";
import type { DashboardOverview } from "../api";
import { StatCardGrid, type StatCardDef } from "../shared/stat-card";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function StudentOverviewCard({ data }: { data: DashboardOverview }) {
  const so = data.studentOverview;
  const cards: StatCardDef[] = [
    { label: "Total Students", value: so.totalStudents.toLocaleString(), icon: Users, iconBg: "bg-brand-100", iconColor: "text-brand-600", cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900", sparkData: [20, 35, 45, 60, 75, 90, so.totalStudents], sparkColor: "#a64dff" },
    { label: "Active Students", value: so.activeStudents.toLocaleString(), icon: UserCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900", sparkData: [15, 30, 40, 55, 70, 85, so.activeStudents], sparkColor: "#10b981" },
    { label: "Total Certified", value: so.totalCertified.toLocaleString(), icon: Award, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900", sparkData: [2, 1, 3, 2, 4, 3, so.totalCertified], sparkColor: "#f59e0b" },
    { label: "Live Course Students", value: so.liveCourseStudents.toLocaleString(), icon: Video, iconBg: "bg-pink-100", iconColor: "text-pink-600", cardBg: "bg-gradient-to-br from-pink-50/80 to-white dark:from-pink-500/10 dark:to-slate-900", sparkData: [5, 8, 12, 10, 15, 18, so.liveCourseStudents], sparkColor: "#ec4899" },
    { label: "Recorded Course Students", value: so.recordedCourseStudents.toLocaleString(), icon: BookOpen, iconBg: "bg-blue-100", iconColor: "text-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900", sparkData: [10, 25, 40, 55, 70, 85, so.recordedCourseStudents], sparkColor: "#3b82f6" },
    { label: "Free Course Students", value: so.freeCourseStudents.toLocaleString(), icon: Gift, iconBg: "bg-teal-100", iconColor: "text-teal-600", cardBg: "bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-500/10 dark:to-slate-900", sparkData: [1, 2, 1, 3, 2, 4, so.freeCourseStudents], sparkColor: "#14b8a6" },
    { label: "Dropout Students", value: so.dropoutStudents.toLocaleString(), icon: UserMinus, iconBg: "bg-red-100", iconColor: "text-red-600", cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900", sparkData: [50, 45, 40, 35, 30, 25, so.dropoutStudents], sparkColor: "#ef4444" },
    { label: "Today's Active Learners", value: data.visitorActivity.uniqueVisitors.toLocaleString(), icon: UserCog, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", cardBg: "bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-500/10 dark:to-slate-900", sparkData: [3, 5, 8, 6, 10, 12, data.visitorActivity.uniqueVisitors], sparkColor: "#6366f1" },
    { label: "Today's Watch Time", value: formatDuration(data.visitorActivity.avgStaySeconds), icon: Clock, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", cardBg: "bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-500/10 dark:to-slate-900", sparkData: [5, 8, 12, 10, 15, 18, data.visitorActivity.avgStaySeconds], sparkColor: "#06b6d4" },
  ];

  return <StatCardGrid title="Student Overview" accentColor="text-brand-600" cards={cards} columns={3} />;
}
