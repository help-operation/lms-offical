import { Headset } from "lucide-react";
import type { DashboardOverview } from "../api";
import { StatCardGrid, type StatCardDef } from "../shared/stat-card";

export function SupportOverviewGrid({ data }: { data: DashboardOverview["supportOverview"] }) {
  const avgMinutes = Math.round(data.avgSolutionSeconds / 60);
  const avgLabel = avgMinutes >= 60 ? `${Math.round(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes}m`;
  const cards: StatCardDef[] = [
    { label: "Today", value: data.today.toLocaleString(), icon: Headset, iconBg: "bg-blue-100", iconColor: "text-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900", sparkData: [3, 5, 2, 7, 4, 6, data.today], sparkColor: "#3b82f6" },
    { label: "This Week", value: data.week.toLocaleString(), icon: Headset, iconBg: "bg-brand-100", iconColor: "text-brand-600", cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900", sparkData: [10, 15, 12, 18, 14, 20, data.week], sparkColor: "#a64dff" },
    { label: "This Month", value: data.month.toLocaleString(), icon: Headset, iconBg: "bg-pink-100", iconColor: "text-pink-600", cardBg: "bg-gradient-to-br from-pink-50/80 to-white dark:from-pink-500/10 dark:to-slate-900", sparkData: [30, 35, 28, 42, 38, 45, data.month], sparkColor: "#ec4899" },
    { label: "Total Support", value: data.total.toLocaleString(), icon: Headset, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900", sparkData: [50, 60, 55, 70, 65, 80, data.total], sparkColor: "#f59e0b" },
    { label: "Avg Solution Time", value: avgLabel, icon: Headset, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900", sparkData: [15, 12, 10, 8, 9, 7, avgMinutes], sparkColor: "#10b981" },
  ];
  return <StatCardGrid title="Support Overview" accentColor="text-blue-600" cards={cards} columns={5} />;
}
