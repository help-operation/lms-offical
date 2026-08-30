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
    { label: "Page View", value: data.pageViews.toLocaleString(), icon: Eye, iconBg: "bg-brand-100", iconColor: "text-brand-600" },
    { label: "Unique Visitor", value: data.uniqueVisitors.toLocaleString(), icon: Users, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Live Chat / Message", value: data.liveChatMessages.toLocaleString(), icon: MessageSquare, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    { label: "Avg. Page Stay Time", value: formatDuration(data.avgStaySeconds), icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  ];
  return <StatCardGrid title="Visitor Activity" accentColor="text-brand-600" cards={cards} />;
}
