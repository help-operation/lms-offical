import { Headset } from "lucide-react";
import type { DashboardOverview } from "../api";
import { StatCardGrid, type StatCardDef } from "../shared/stat-card";

export function SupportOverviewGrid({ data }: { data: DashboardOverview["supportOverview"] }) {
  const avgMinutes = Math.round(data.avgSolutionSeconds / 60);
  const avgLabel = avgMinutes >= 60 ? `${Math.round(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes}m`;
  const cards: StatCardDef[] = [
    { label: "Today", value: data.today.toLocaleString(), icon: Headset, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "This Week", value: data.week.toLocaleString(), icon: Headset, iconBg: "bg-brand-100", iconColor: "text-brand-600" },
    { label: "This Month", value: data.month.toLocaleString(), icon: Headset, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    { label: "Total Support", value: data.total.toLocaleString(), icon: Headset, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { label: "Avg Solution Time", value: avgLabel, icon: Headset, iconBg: "bg-green-100", iconColor: "text-green-600" },
  ];
  return <StatCardGrid title="Support Overview" accentColor="text-blue-600" cards={cards} />;
}
