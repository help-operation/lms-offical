import { Eye, Users, Clock, MessageSquare } from "lucide-react";
import type { DashboardOverview } from "../api";
import { StatCardGrid, type StatCardDef } from "../shared/stat-card";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function VisitorActivityCard({ data }: { data: DashboardOverview["visitorActivity"] }) {
  const cards: StatCardDef[] = [
    { label: "Page View", value: data.pageViews.toLocaleString(), icon: Eye, iconBg: "bg-brand-100", iconColor: "text-brand-600", cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900", sparkData: [20, 35, 28, 45, 52, 68, data.pageViews], sparkColor: "#a64dff" },
    { label: "Unique Visitor", value: data.uniqueVisitors.toLocaleString(), icon: Users, iconBg: "bg-blue-100", iconColor: "text-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900", sparkData: [5, 8, 12, 10, 15, 18, data.uniqueVisitors], sparkColor: "#3b82f6" },
    { label: "Live Chat / Message", value: data.liveChatMessages.toLocaleString(), icon: MessageSquare, iconBg: "bg-pink-100", iconColor: "text-pink-600", cardBg: "bg-gradient-to-br from-pink-50/80 to-white dark:from-pink-500/10 dark:to-slate-900", sparkData: [0, 1, 2, 0, 3, 1, data.liveChatMessages], sparkColor: "#ec4899" },
    { label: "Avg. Page Stay Time", value: formatDuration(data.avgStaySeconds), icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900", sparkData: [3, 5, 4, 7, 6, 8, data.avgStaySeconds], sparkColor: "#f59e0b" },
  ];
  return <StatCardGrid title="Visitor Activity" accentColor="text-brand-600" cards={cards} columns={4} />;
}
